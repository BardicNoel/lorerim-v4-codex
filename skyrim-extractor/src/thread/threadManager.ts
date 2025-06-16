// src/thread/threadManager.ts
import { Worker } from "worker_threads";
import * as path from "path";
import { PluginMeta } from "../types";
import { RecordAggregator } from "../aggregator";
import { createFileWriter } from "../utils/fileWriter";
import { ProcessingStats } from "../utils/stats";
import { createWriteStream, WriteStream } from "fs";
import * as fs from "fs/promises";
import { ParsedRecord } from "@lorerim/platform-types";

const MAX_CONCURRENCY = 4;
const PROGRESS_INTERVAL = 1000; // Log progress every second

export interface ThreadManager {
  processPlugins(
    plugins: PluginMeta[],
    outputDir: string,
    debug?: boolean
  ): Promise<void>;
  getStats(): ProcessingStats;
  clear(): void;
}

class ThreadManagerImpl implements ThreadManager {
  private workers: (Worker | null)[] = [];
  private aggregator!: RecordAggregator;
  private fileWriter = createFileWriter();
  private activeWorkers = 0;
  private pluginQueue: PluginMeta[] = [];
  private processedPlugins = 0;
  private totalPlugins = 0;
  private lastProgressLog = 0;
  private workerLogs: Map<string, string[]> = new Map();
  private debugLogStream: WriteStream | null = null;
  private debug: boolean = false;
  private workerStates: Map<
    number,
    { plugin: PluginMeta | null; status: string }
  > = new Map();
  private startTime: number = Date.now();
  private workerTimeouts: Map<number, NodeJS.Timeout> = new Map();
  private readonly WORKER_TIMEOUT = 300000; // 5 minutes timeout

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

  private logWorkerState(
    workerId: number,
    status: string,
    plugin: PluginMeta | null = null
  ): void {
    this.workerStates.set(workerId, { plugin, status });
    if (this.debug) {
      console.log(
        `Worker ${workerId}: ${status}${plugin ? ` (${plugin.name})` : ""}`
      );
    }
  }

  private cleanupWorker(workerId: number, worker: Worker) {
    // Clear any existing timeout
    const existingTimeout = this.workerTimeouts.get(workerId);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
      this.workerTimeouts.delete(workerId);
    }

    // Terminate worker if it's still running
    if (worker) {
      try {
        worker.terminate();
      } catch (error) {
        console.error(`Error terminating worker ${workerId}:`, error);
      }
    }

    this.activeWorkers--;
    this.workers[workerId] = null;

    // Start next worker if queue not empty
    if (this.pluginQueue.length > 0) {
      this.startWorker(workerId);
    } else {
      this.logWorkerState(workerId, "idle");
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
    this.workerStates.clear();
    this.workerTimeouts.clear();

    // Initialize aggregator with plugins
    this.aggregator = new RecordAggregator({ plugins });

    // Log plugin sizes before starting
    for (let i = 0; i < plugins.length; i++) {
      const plugin = plugins[i];
      const stats = await fs.stat(plugin.fullPath);
      const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
      console.log(`[${i + 1}/${plugins.length}] ${plugin.name} (${sizeMB} MB)`);
    }
    console.log();

    const workerCount = Math.min(MAX_CONCURRENCY, plugins.length);
    console.log(
      `Starting to process ${this.totalPlugins} plugins with ${workerCount} workers`
    );

    // Start initial batch of workers
    for (let i = 0; i < workerCount; i++) {
      this.startWorker(i);
    }

    // Wait for all plugins to be processed
    while (this.activeWorkers > 0 || this.pluginQueue.length > 0) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      this.logProgress();
    }

    // Clean up any remaining workers
    for (let i = 0; i < this.workers.length; i++) {
      if (this.workers[i]) {
        this.cleanupWorker(i, this.workers[i] as Worker);
      }
    }

    if (this.debug) {
      console.log("\nAll plugins processed, writing records to disk...");
    }

    // Write all records to disk
    const records = this.aggregator.getRecords();
    const stats = this.aggregator.getStats();

    // Group records by type before writing
    const recordsByType: Record<string, ParsedRecord[]> = {};
    for (const record of records) {
      const type = record.meta.type;
      if (!recordsByType[type]) {
        recordsByType[type] = [];
      }
      recordsByType[type].push(record);
    }

    await this.fileWriter.writeRecords(recordsByType, outputDir);
    await this.fileWriter.writeStats(stats, outputDir);

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

      // Record error in stats
      this.aggregator.recordError(`WorkerError_${plugin.name}`);

      if (message.error) {
        const errorDetails = `[${plugin.name}] ${message.error}`;
        console.error(errorDetails);
        this.writeDebugLog(errorDetails);
      }
    } else if (message.type === "skip" && message.recordType && message.size) {
      // Record skipped record in stats
      this.aggregator.recordSkipped(message.recordType, message.size);

      if (this.debug) {
        console.log(
          `[${plugin.name}] Skipped record type: ${message.recordType} (${message.size} bytes)`
        );
      }
    }
  }

  /**
   * Start a new worker thread
   */
  private startWorker(workerId: number): void {
    if (this.pluginQueue.length === 0) {
      this.logWorkerState(workerId, "idle");
      return;
    }

    const plugin = this.pluginQueue.shift()!;
    const workerPath = path.join(
      process.cwd(),
      "dist",
      "thread",
      "pluginWorker.js"
    );

    this.logWorkerState(workerId, "starting", plugin);

    const worker = new Worker(workerPath);
    this.workers[workerId] = worker;
    this.activeWorkers++;
    this.workerLogs.set(plugin.name, []);

    // Set timeout for worker
    const timeout = setTimeout(() => {
      console.error(`Worker ${workerId} timed out processing ${plugin.name}`);
      this.aggregator.recordError(
        `${plugin.name}: Worker timed out after ${this.WORKER_TIMEOUT}ms`
      );
      this.cleanupWorker(workerId, worker);
    }, this.WORKER_TIMEOUT);
    this.workerTimeouts.set(workerId, timeout);

    worker.on("message", (message: any) => {
      if (message.status === "done") {
        // Add records to aggregator using processPluginRecords
        this.aggregator.processPluginRecords(plugin.index, message.records);

        // Update progress
        this.processedPlugins++;
        if (this.debug) {
          console.log(
            `Worker ${workerId} completed ${plugin.name} (${message.records.length} records)`
          );
        }

        this.cleanupWorker(workerId, worker);
      } else if (message.type === "error") {
        // Record error with plugin name and message
        this.aggregator.recordError(`${plugin.name}: ${message.message}`);
        this.cleanupWorker(workerId, worker);
      } else if (message.type === "skip") {
        this.aggregator.recordSkipped(message.recordType, message.size);
      }
    });

    worker.on("error", (error) => {
      // Record error with plugin name and message
      this.aggregator.recordError(`${plugin.name}: ${error.message}`);
      this.cleanupWorker(workerId, worker);
    });

    worker.on("exit", (code) => {
      if (code !== 0) {
        // Record error with plugin name and exit code
        this.aggregator.recordError(
          `${plugin.name}: Worker exited with code ${code}`
        );
      }
      this.cleanupWorker(workerId, worker);
    });

    // Start processing
    worker.postMessage({ plugin });
    this.logWorkerState(workerId, "processing", plugin);
  }

  /**
   * Get statistics about processed records
   */
  getStats(): ProcessingStats {
    const stats = this.aggregator.getStats();
    return {
      ...stats,
      processingTime: Date.now() - this.startTime,
      pluginsProcessed: this.processedPlugins,
    };
  }

  clear(): void {
    this.aggregator.clear();
  }
}

/**
 * Create a new thread manager instance
 */
export function createThreadManager(): ThreadManager {
  return new ThreadManagerImpl();
}
