import { Worker } from "worker_threads";
import { BufferMeta, WorkerMessage, ThreadPoolConfig } from "./types";
import * as path from "path";
import { ParsedRecord, PluginMeta } from "@lorerim/platform-types";
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
  private pluginStartTimes: Map<string, number> = new Map();
  private pluginDurations: number[] = [];
  private pluginLast: { name: string; duration: number } | null = null;
  private processStartTime: number = 0;
  private currentPlugins: Set<string> = new Set();
  private LONG_PLUGIN_FACTOR = 5; // Warn if plugin takes 5x avg

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
    this.pluginStartTimes.clear();
    this.pluginDurations = [];
    this.pluginLast = null;
    this.processStartTime = Date.now();
    this.currentPlugins.clear();

    // Start thread state logger
    const threadLogger = setInterval(() => {
      this.logThreadState();
    }, 5000);

    // Create truncated plugin list for display
    const pluginNames = plugins.map((p) => p.name);
    let displayPlugins = "";
    if (pluginNames.length <= 6) {
      displayPlugins = pluginNames.join(", ");
    } else {
      const firstThree = pluginNames.slice(0, 3).join(", ");
      const lastThree = pluginNames.slice(-3).join(", ");
      displayPlugins = `${firstThree} ... ${lastThree}`;
    }

    console.log(`Processing ${this.totalPlugins} plugins: ${displayPlugins}`);

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

    clearInterval(threadLogger);

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

    const handleWorkerDone = (pluginName?: string, duration?: number) => {
      this.activeWorkers--;
      this.availableWorkers.push(worker);
      if (pluginName && duration !== undefined) {
        this.pluginDurations.push(duration);
        this.pluginLast = { name: pluginName, duration };
        this.currentPlugins.delete(pluginName);
        const pluginIndex = this.processedPlugins; // 1-based index of completed plugin
        this.onLog?.(
          `Plugin completed: ${pluginName} (${pluginIndex}/${this.totalPlugins}) (${duration.toFixed(2)}s)`
        );
      }
      this.processNextTask();
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
        const pluginName = message.plugin;
        const start = this.pluginStartTimes.get(pluginName!);
        const end = Date.now();
        let duration = 0;
        if (start) {
          duration = (end - start) / 1000;
        }
        handleWorkerDone(pluginName, duration);
      } else if (message.error) {
        this.onLog?.(`Error: ${message.error}`);
        this.processedPlugins++;
        const pluginName = message.plugin;
        const start = pluginName
          ? this.pluginStartTimes.get(pluginName)
          : undefined;
        const end = Date.now();
        let duration = 0;
        if (start) {
          duration = (end - start) / 1000;
        }
        handleWorkerDone(pluginName, duration);
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
      this.pluginStartTimes.set(plugin.name, Date.now());
      this.currentPlugins.add(plugin.name);
      const pluginIndex = this.processedPlugins + this.currentPlugins.size; // 1-based index of this plugin
      this.onLog?.(
        `Plugin started: ${plugin.name} (${pluginIndex}/${this.totalPlugins})`
      );
      worker.postMessage({
        plugin,
        recordTypeFilter: this.config.recordTypeFilter,
        stackOrder: this.totalPlugins - 1 - plugin.loadOrder,
      });
    }
  }

  private logProgress(): void {
    const now = Date.now();
    if (now - this.lastProgressLog >= this.PROGRESS_INTERVAL) {
      const progress = (this.processedPlugins / this.totalPlugins) * 100;
      const elapsed = (now - this.processStartTime) / 1000;
      const avg = this.pluginDurations.length
        ? this.pluginDurations.reduce((a, b) => a + b, 0) /
          this.pluginDurations.length
        : 0;
      const min = this.pluginDurations.length
        ? Math.min(...this.pluginDurations)
        : 0;
      const max = this.pluginDurations.length
        ? Math.max(...this.pluginDurations)
        : 0;
      const remaining = this.totalPlugins - this.processedPlugins;
      const estRemaining = avg > 0 ? remaining * avg : 0;
      const last = this.pluginLast;
      const active = this.activeWorkers;
      const idle = this.availableWorkers.length;
      const current = Array.from(this.currentPlugins).join(", ");
      let mem = "";
      if (typeof process !== "undefined" && process.memoryUsage) {
        const m = process.memoryUsage();
        mem = ` | Mem: ${(m.rss / 1024 / 1024).toFixed(1)}MB`;
      }
      this.onLog?.(
        `Progress: ${progress.toFixed(1)}% (${this.processedPlugins}/$${this.totalPlugins} plugins) | Elapsed: ${elapsed.toFixed(1)}s | Est. left: ${estRemaining.toFixed(1)}s | Active: ${active} | Idle: ${idle}${mem}`
      );
      if (current) {
        this.onLog?.(`  Currently processing: ${current}`);
      }
      if (last) {
        this.onLog?.(
          `  Last plugin: ${last.name} (${last.duration.toFixed(2)}s)`
        );
      }
      if (this.pluginDurations.length > 0) {
        this.onLog?.(
          `  Plugin times (s): min=${min.toFixed(2)}, avg=${avg.toFixed(2)}, max=${max.toFixed(2)}`
        );
      }
      // Warn if any current plugin is taking much longer than avg
      if (avg > 0) {
        for (const pluginName of this.currentPlugins) {
          const start = this.pluginStartTimes.get(pluginName);
          if (start) {
            const running = (now - start) / 1000;
            if (running > this.LONG_PLUGIN_FACTOR * avg) {
              this.onLog?.(
                `  WARNING: Plugin ${pluginName} is taking unusually long (${running.toFixed(2)}s, avg=${avg.toFixed(2)}s)`
              );
            }
          }
        }
      }
      this.lastProgressLog = now;
    }
  }

  private logThreadState(): void {
    const active = this.activeWorkers;
    const idle = this.availableWorkers.length;
    const total = this.workers.length;
    const busy = total - idle;
    const workerStates = this.workers.map((w, i) => {
      const isIdle = this.availableWorkers.includes(w);
      return `Worker ${i}: ${isIdle ? "idle" : "active"}`;
    });
    this.onLog?.(
      `[Thread State] Total: ${total}, Active: ${busy}, Idle: ${idle} | ${workerStates.join(", ")}`
    );
  }
}
