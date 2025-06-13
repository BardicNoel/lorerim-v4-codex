// src/thread/threadManager.ts
import { Worker } from 'worker_threads';
import path from 'path';
import { PluginMeta } from '../types';
import { ParsedRecord } from '../types';
import { debugLog } from '../utils/debugUtils';

export class ThreadManager {
  private workers: Worker[] = [];
  private queue: PluginMeta[] = [];
  private activeWorkers = 0;
  private maxWorkers: number;
  private onRecord: (record: any) => void;

  constructor(maxWorkers: number, onRecord: (record: any) => void) {
    this.maxWorkers = Math.min(maxWorkers, 8); // Cap at 8 workers
    this.onRecord = onRecord;
  }

  async processPlugin(plugin: PluginMeta): Promise<void> {
    debugLog(`\nThread Manager: Processing plugin ${plugin.name}`);
    debugLog(`  Active workers: ${this.activeWorkers}/${this.maxWorkers}`);
    debugLog(`  Queue size: ${this.queue.length}`);

    return new Promise((resolve, reject) => {
      if (this.activeWorkers >= this.maxWorkers) {
        debugLog(`  Queueing plugin ${plugin.name} (max workers reached)`);
        this.queue.push(plugin);
        return;
      }

      this.startWorker(plugin, resolve, reject);
    });
  }

  private async startWorker(plugin: PluginMeta, resolve: () => void, reject: (error: Error) => void): Promise<void> {
    debugLog(`\nThread Manager: Starting worker for ${plugin.name}`);
    const worker = new Worker(path.join(__dirname, 'pluginWorker.js'));
    this.workers.push(worker);
    this.activeWorkers++;

    worker.on('message', (message) => {
      if (message.type === 'debug') {
        debugLog(`[Worker ${plugin.name}] ${message.message}`);
      } else if (message.type === 'record') {
        this.onRecord(message.record);
      } else if (message.type === 'done') {
        debugLog(`Thread Manager: Worker completed ${plugin.name}`);
        this.cleanupWorker(worker);
        resolve();
        this.processNextInQueue();
      } else if (message.type === 'error') {
        debugLog(`Thread Manager: Worker error for ${plugin.name}: ${message.error}`);
        this.cleanupWorker(worker);
        reject(new Error(message.error));
        this.processNextInQueue();
      }
    });

    worker.on('error', (error) => {
      debugLog(`\nThread Manager: Worker crashed for ${plugin.name}: ${error}`);
      this.cleanupWorker(worker);
      reject(error);
      this.processNextInQueue();
    });

    worker.on('exit', (code) => {
      if (code !== 0) {
        debugLog(`\nThread Manager: Worker exited with code ${code} for ${plugin.name}`);
      }
    });

    debugLog(`Thread Manager: Sending process message to worker for ${plugin.name}`);
    worker.postMessage({ type: 'process', plugin });
  }

  private cleanupWorker(worker: Worker): void {
    const index = this.workers.indexOf(worker);
    if (index !== -1) {
      this.workers.splice(index, 1);
    }
    this.activeWorkers--;
    debugLog(`Thread Manager: Cleaned up worker. Active workers: ${this.activeWorkers}/${this.maxWorkers}`);
    worker.terminate();
  }

  private processNextInQueue(): void {
    if (this.queue.length > 0 && this.activeWorkers < this.maxWorkers) {
      const nextPlugin = this.queue.shift()!;
      debugLog(`\nThread Manager: Processing next plugin from queue: ${nextPlugin.name}`);
      this.processPlugin(nextPlugin);
    }
  }

  async shutdown(): Promise<void> {
    debugLog('\nThread Manager: Shutting down...');
    debugLog(`  Active workers: ${this.activeWorkers}`);
    debugLog(`  Queue size: ${this.queue.length}`);

    const shutdownPromises = this.workers.map(worker => {
      return new Promise<void>((resolve) => {
        worker.on('exit', () => resolve());
        worker.terminate();
      });
    });

    await Promise.all(shutdownPromises);
    this.workers = [];
    this.activeWorkers = 0;
    debugLog('Thread Manager: Shutdown complete');
  }
}
