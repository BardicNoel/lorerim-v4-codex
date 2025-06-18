import { Worker } from "worker_threads";
import { PluginMeta } from "../types";
import { BufferMeta, WorkerMessage, ThreadPoolConfig } from "./types";
import * as path from "path";
import { ParsedRecord } from "@lorerim/platform-types";
import { mergeTypeDictionaries } from "./parsedRecordDataStructs";
import { StatsCollector, ProcessingStats } from "../utils/statsCollector";

export class ThreadPool {
  private workers: Worker[] = [];
  private taskQueue: PluginMeta[] = [];
  private results: BufferMeta[] = [];
  private parsedRecords: ParsedRecord[] = [];
  private activeWorkers = 0;
  private config: ThreadPoolConfig;
  private onLog?: (message: string) => void;
  private processedPlugins = 0;
  private totalPlugins = 0;
  private lastProgressLog = 0;
  private readonly PROGRESS_INTERVAL = 1000; // Log progress every second
  private availableWorkers: Worker[] = [];
  private statsCollector: StatsCollector;

  constructor(config: ThreadPoolConfig, onLog?: (message: string) => void) {
    this.config = config;
    this.onLog = onLog;
    this.statsCollector = new StatsCollector();
  }

  public async processPlugins(plugins: PluginMeta[]): Promise<{
    bufferMetas: BufferMeta[];
    parsedRecords: ParsedRecord[];
    stats: ProcessingStats;
  }> {
    this.taskQueue = [...plugins];
    this.results = [];
    this.parsedRecords = [];
    this.activeWorkers = 0;
    this.processedPlugins = 0;
    this.totalPlugins = plugins.length;
    this.lastProgressLog = Date.now();
    this.statsCollector.reset();
    console.log(`Processing ${this.totalPlugins} plugins: ${plugins.map((p) => p.name).join(", ")}`);

    // Create initial worker pool
    const workerCount = Math.min(this.config.maxThreads, plugins.length);
    for (let i = 0; i < workerCount; i++) {
      await this.createWorker();
    }
    this.processNextTask(); // 🔁 Kick off first batch of tasks

    // Wait for all tasks to complete
    while (this.activeWorkers > 0 || this.taskQueue.length > 0) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      this.logProgress();
    }

    // Terminate all workers
    await Promise.all(this.workers.map((worker) => worker.terminate()));
    this.workers = [];



    return {
      bufferMetas: this.results,
      parsedRecords: this.parsedRecords,
      stats: this.statsCollector.getStats(),
    };
  }

  private async createWorker(): Promise<void> {
    const worker = new Worker(path.join(__dirname, "PluginWorker.ts"), {
      execArgv: ["-r", "ts-node/register"],
    });

    const handleWorkerDone = () => {
      this.activeWorkers--;
      this.availableWorkers.push(worker);
      this.processNextTask(); // only runs when a worker finishes
    };

    worker.on("message", (message: WorkerMessage) => {
      if (message.log && this.onLog) {
        this.onLog(`[${message.level?.toUpperCase()}] ${message.message}`);
      } else if (message.bufferMetas) {
        message.bufferMetas.forEach((meta) => this.results.push(meta));

        if (message.parsedRecords) {
          message.parsedRecords.forEach((record) =>
            this.parsedRecords.push(record)
          );
        }
        if (message.stats) {
          // Merge stats from worker
          const workerStats = message.stats;
          for (const [plugin, stats] of Object.entries(workerStats.plugins)) {
            // Process skipped records by type
            for (const [recordType, count] of Object.entries(
              workerStats.skippedRecords.byType
            )) {
              for (let i = 0; i < count; i++) {
                this.statsCollector.recordSkipped(
                  plugin,
                  recordType,
                  "Filtered by record type"
                );
              }
            }
            // Process errors by type
            for (const error of workerStats.errors.details) {
              this.statsCollector.recordError(
                plugin,
                error.type,
                error.message,
                error.recordId
              );
            }
            // Process successful records
            for (let i = 0; i < stats.processed; i++) {
              this.statsCollector.recordProcessed(plugin, "unknown");
            }
          }
        }
        this.processedPlugins++;
        handleWorkerDone();
      } else if (message.error) {
        this.onLog?.(`Error: ${message.error}`);
        this.processedPlugins++;
        handleWorkerDone();
      }
    });

    worker.on("error", (error) => {
      this.onLog?.(`Worker error: ${error.message}`);
      this.processedPlugins++;
      handleWorkerDone();
    });

    this.workers.push(worker);
    this.availableWorkers.push(worker);
  }

  private processNextTask(): void {
    while (this.taskQueue.length > 0 && this.availableWorkers.length > 0) {
      const plugin = this.taskQueue.shift()!;
      const worker = this.availableWorkers.shift()!;
      this.activeWorkers++;
      worker.postMessage({
        plugin,
        recordTypeFilter: this.config.recordTypeFilter,
        stackOrder: this.totalPlugins - 1 - plugin.index,
      });
    }
  }

  private logProgress(): void {
    const now = Date.now();
    if (now - this.lastProgressLog >= this.PROGRESS_INTERVAL) {
      const progress = (this.processedPlugins / this.totalPlugins) * 100;
      this.onLog?.(
        `Progress: ${progress.toFixed(1)}% (${this.processedPlugins}/${
          this.totalPlugins
        } plugins)`
      );
      this.lastProgressLog = now;
    }
  }
}
