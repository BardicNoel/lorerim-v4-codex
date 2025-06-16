// src/thread/threadManager.ts
import { Worker } from "worker_threads";
import * as path from "path";
import { PluginMeta } from "../types";
import { createRecordAggregator } from "../utils/recordAggregator";
import { createFileWriter } from "../utils/fileWriter";
import { ProcessingStats } from "../utils/stats";
import { RecordAggregator } from "../aggregator";
import { createWriteStream, WriteStream } from "fs";
import * as fs from "fs/promises";

const MAX_CONCURRENCY = 4;
const PROGRESS_INTERVAL = 1000; // Log progress every second

export interface ThreadManager {
  processPlugins(
    plugins: PluginMeta[],
    outputDir: string,
    debug?: boolean
  ): Promise<void>;
  getStats(): Record<string, number>;
}

class ThreadManagerImpl implements ThreadManager {
  private workers: Worker[] = [];
  private aggregator = createRecordAggregator();
  private fileWriter = createFileWriter();
  private activeWorkers = 0;
  private pluginQueue: PluginMeta[] = [];
  private processedPlugins = 0;
  private totalPlugins = 0;
  private lastProgressLog = 0;
  private workerLogs: Map<string, string[]> = new Map();
  private debugLogStream: WriteStream | null = null;
  private debug: boolean = false;

  constructor() {
    // Initialize debug log file
    const logPath = path.join(process.cwd(), "debug.log");
    this.debugLogStream = createWriteStream(logPath, { flags: "w" });
  }

  private writeDebugLog(message: string): void {
    if (this.debugLogStream) {
      const timestamp = new Date().toISOString();
      const logMessage = `[${timestamp}] ${message}\n`;
      this.debugLogStream.write(logMessage);
    }
  }

  /**
   * Process all plugins using worker threads
   */
  async processPlugins(
    plugins: PluginMeta[],
    outputDir: string,
    debug: boolean = false
  ): Promise<void> {
    this.debug = debug;
    this.pluginQueue = [...plugins];
    this.totalPlugins = plugins.length;
    this.processedPlugins = 0;
    this.lastProgressLog = Date.now();
    this.workerLogs.clear();

    // Log plugin sizes before starting
    for (let i = 0; i < plugins.length; i++) {
      const plugin = plugins[i];
      const stats = await fs.stat(plugin.fullPath);
      const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
      console.log(`[${i + 1}/${plugins.length}] ${plugin.name} (${sizeMB} MB)`);
    }
    console.log();

    console.log(
      `Starting to process ${this.totalPlugins} plugins with ${MAX_CONCURRENCY} workers`
    );

    // Start initial batch of workers
    const initialBatch = Math.min(MAX_CONCURRENCY, plugins.length);
    for (let i = 0; i < initialBatch; i++) {
      this.startWorker();
    }

    // Wait for all plugins to be processed
    while (this.activeWorkers > 0 || this.pluginQueue.length > 0) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      this.logProgress();
    }

    if (this.debug) {
      console.log("\nAll plugins processed, writing records to disk...");
    }

    // Write all records to disk
    const records = this.aggregator.getRecords();
    const recordCounts = this.aggregator.getStats();
    const stats: ProcessingStats = {
      totalRecords: Object.values(recordCounts).reduce(
        (sum: number, count: number) => sum + count,
        0
      ),
      recordsByType: recordCounts,
      skippedRecords: 0,
      skippedTypes: new Set(),
      totalBytes: 0,
      processingTime: 0,
      pluginsProcessed: 1,
      errors: {
        count: 0,
        types: {},
      },
    };

    await this.fileWriter.writeRecords(records, outputDir);
    await this.fileWriter.writeStats(stats, outputDir);

    // Clear the aggregator after writing
    this.aggregator.clear();

    if (this.debug) {
      console.log("Records written to disk successfully");
    }
  }

  /**
   * Log progress if enough time has passed
   */
  private logProgress(): void {
    const now = Date.now();
    if (now - this.lastProgressLog >= PROGRESS_INTERVAL) {
      const progress = (this.processedPlugins / this.totalPlugins) * 100;
      console.log(
        `Progress: ${progress.toFixed(1)}% (${this.processedPlugins}/${
          this.totalPlugins
        } plugins)`
      );
      this.lastProgressLog = now;
    }
  }

  /**
   * Handle debug messages from workers
   */
  private handleWorkerMessage(
    worker: Worker,
    plugin: PluginMeta,
    message: any
  ): void {
    if (message.type === "debug") {
      const logs = this.workerLogs.get(plugin.name) || [];
      const logMessage = message.data
        ? `${message.message}\n${JSON.stringify(message.data, null, 2)}`
        : message.message;
      logs.push(logMessage);
      this.workerLogs.set(plugin.name, logs);

      // Write to both console and file
      const fullMessage = `[${plugin.name}] ${logMessage}`;
      if (this.debug) {
        console.log(fullMessage);
      }
      this.writeDebugLog(fullMessage);
    } else if (message.type === "error") {
      const errorMessage = `[${plugin.name}] ERROR: ${message.message}`;
      console.error(errorMessage);
      this.writeDebugLog(errorMessage);
      if (message.error) {
        const errorDetails = `[${plugin.name}] ${message.error}`;
        console.error(errorDetails);
        this.writeDebugLog(errorDetails);
      }
    }
  }

  /**
   * Start a new worker thread
   */
  private startWorker(): void {
    if (this.pluginQueue.length === 0) return;

    const plugin = this.pluginQueue.shift()!;
    const workerPath = path.join(
      process.cwd(),
      "dist",
      "thread",
      "pluginWorker.js"
    );
    if (this.debug) {
      console.log("Starting worker from path:", workerPath);
    }
    const worker = new Worker(workerPath);
    this.activeWorkers++;
    this.workerLogs.set(plugin.name, []);

    if (this.debug) {
      console.log(`Starting worker for ${plugin.name}`);
    }

    worker.on("message", (message: any) => {
      if (this.debug) {
        console.log(
          `Received message from worker for ${plugin.name}:`,
          message.type || message.status
        );
      }

      if (message.status === "done") {
        // Add records to aggregator
        for (const record of message.records) {
          this.aggregator.addRecord(record);
        }

        // Update progress
        this.processedPlugins++;
        if (this.debug) {
          console.log(
            `Completed ${plugin.name} (${message.records.length} records)`
          );
        }

        // Clean up worker
        worker.terminate();
        this.activeWorkers--;

        // Start next worker if queue not empty
        if (this.pluginQueue.length > 0) {
          this.startWorker();
        }
      } else if (message.type === "debug" || message.type === "error") {
        this.handleWorkerMessage(worker, plugin, message);
      }
    });

    worker.on("error", (error) => {
      console.error(`Worker error processing ${plugin.name}:`, error);
      worker.terminate();
      this.activeWorkers--;

      // Start next worker if queue not empty
      if (this.pluginQueue.length > 0) {
        this.startWorker();
      }
    });

    // Start processing
    worker.postMessage({ plugin });
  }

  /**
   * Get statistics about processed records
   */
  getStats(): Record<string, number> {
    return this.aggregator.getStats();
  }
}

/**
 * Create a new thread manager instance
 */
export function createThreadManager(): ThreadManager {
  return new ThreadManagerImpl();
}
