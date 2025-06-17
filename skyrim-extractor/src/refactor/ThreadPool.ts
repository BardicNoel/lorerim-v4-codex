import { Worker } from 'worker_threads';
import { PluginMeta } from '../types';
import { BufferMeta, WorkerMessage, ThreadPoolConfig } from './types';
import * as path from 'path';
import { ParsedRecord } from '@lorerim/platform-types';
import { mergeTypeDictionaries } from './parsedRecordDataStructs';

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

  constructor(config: ThreadPoolConfig, onLog?: (message: string) => void) {
    this.config = config;
    this.onLog = onLog;
  }

  public async processPlugins(plugins: PluginMeta[]): Promise<{ bufferMetas: BufferMeta[], parsedRecordDict: Record<string, ParsedRecord[]> }> {
    this.taskQueue = [...plugins];
    this.results = [];
    this.parsedRecords = [];
    this.activeWorkers = 0;
    this.processedPlugins = 0;
    this.totalPlugins = plugins.length;
    this.lastProgressLog = Date.now();

    // Create initial worker pool
    const workerCount = Math.min(this.config.maxThreads, plugins.length);
    for (let i = 0; i < workerCount; i++) {
      await this.createWorker();
    }

    // Wait for all tasks to complete
    while (this.activeWorkers > 0 || this.taskQueue.length > 0) {
      await new Promise(resolve => setTimeout(resolve, 100));
      this.logProgress();
    }

    // Terminate all workers
    await Promise.all(this.workers.map(worker => worker.terminate()));
    this.workers = [];

    return {
      bufferMetas: this.results,
      parsedRecordDict: mergeTypeDictionaries(this.parsedRecords)
    };
  }

  private async createWorker(): Promise<void> {
    const worker = new Worker(path.join(__dirname, 'PluginWorker.ts'), {
      execArgv: ['-r', 'ts-node/register']
    });
    
    worker.on('message', (message: WorkerMessage) => {
      if (message.log && this.onLog) {
        this.onLog(`[${message.level?.toUpperCase()}] ${message.message}`);
      } else if (message.bufferMetas) {
        this.results.push(...message.bufferMetas);
        if (message.parsedRecords) {
          this.parsedRecords.push(...message.parsedRecords);
        }
        this.processedPlugins++;
        this.activeWorkers--;
        this.processNextTask();
      } else if (message.error) {
        this.onLog?.(`Error: ${message.error}`);
        this.processedPlugins++;
        this.activeWorkers--;
        this.processNextTask();
      }
    });

    worker.on('error', (error) => {
      this.onLog?.(`Worker error: ${error.message}`);
      this.processedPlugins++;
      this.activeWorkers--;
      this.processNextTask();
    });

    this.workers.push(worker);
    this.activeWorkers++;
    this.processNextTask();
  }

  private processNextTask(): void {
    if (this.taskQueue.length > 0) {
      const plugin = this.taskQueue.shift()!;
      const worker = this.workers[this.activeWorkers - 1];
      worker.postMessage({
        plugin,
        recordTypeFilter: this.config.recordTypeFilter
      });
    }
  }

  private logProgress(): void {
    const now = Date.now();
    if (now - this.lastProgressLog >= this.PROGRESS_INTERVAL) {
      const progress = (this.processedPlugins / this.totalPlugins) * 100;
      this.onLog?.(`Progress: ${progress.toFixed(1)}% (${this.processedPlugins}/${this.totalPlugins} plugins)`);
      this.lastProgressLog = now;
    }
  }

  
} 