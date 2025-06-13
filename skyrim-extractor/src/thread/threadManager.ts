// src/thread/threadManager.ts
import { Worker } from 'worker_threads';
import path from 'path';
import { PluginMeta } from '../types';

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
    console.log(`\nThread Manager: Processing plugin ${plugin.name}`);
    console.log(`  Active workers: ${this.activeWorkers}/${this.maxWorkers}`);
    console.log(`  Queue size: ${this.queue.length}`);

    return new Promise((resolve, reject) => {
      if (this.activeWorkers >= this.maxWorkers) {
        console.log(`  Queueing plugin ${plugin.name} (max workers reached)`);
        this.queue.push(plugin);
        return;
      }

      this.startWorker(plugin, resolve, reject);
    });
  }

  private async startWorker(plugin: PluginMeta, resolve: () => void, reject: (error: Error) => void): Promise<void> {
    console.log(`\nThread Manager: Starting worker for ${plugin.name}`);
    const worker = new Worker(path.join(__dirname, 'pluginWorker.js'));
    this.workers.push(worker);
    this.activeWorkers++;

    worker.on('message', (message) => {
      console.log(`\nThread Manager: Message from ${plugin.name}:`, message.type);
      if (message.type === 'record') {
        this.onRecord(message.record);
      } else if (message.type === 'done') {
        console.log(`Thread Manager: Worker completed ${plugin.name}`);
        this.cleanupWorker(worker);
        resolve();
        this.processNextInQueue();
      } else if (message.type === 'error') {
        console.error(`Thread Manager: Worker error for ${plugin.name}:`, message.error);
        this.cleanupWorker(worker);
        reject(new Error(message.error));
        this.processNextInQueue();
      }
    });

    worker.on('error', (error) => {
      console.error(`\nThread Manager: Worker crashed for ${plugin.name}:`, error);
      this.cleanupWorker(worker);
      reject(error);
      this.processNextInQueue();
    });

    worker.on('exit', (code) => {
      if (code !== 0) {
        console.error(`\nThread Manager: Worker exited with code ${code} for ${plugin.name}`);
      }
    });

    console.log(`Thread Manager: Sending process message to worker for ${plugin.name}`);
    worker.postMessage({ type: 'process', plugin });
  }

  private cleanupWorker(worker: Worker): void {
    const index = this.workers.indexOf(worker);
    if (index !== -1) {
      this.workers.splice(index, 1);
    }
    this.activeWorkers--;
    console.log(`Thread Manager: Cleaned up worker. Active workers: ${this.activeWorkers}/${this.maxWorkers}`);
    worker.terminate();
  }

  private processNextInQueue(): void {
    if (this.queue.length > 0 && this.activeWorkers < this.maxWorkers) {
      const nextPlugin = this.queue.shift()!;
      console.log(`\nThread Manager: Processing next plugin from queue: ${nextPlugin.name}`);
      this.processPlugin(nextPlugin);
    }
  }

  async shutdown(): Promise<void> {
    console.log('\nThread Manager: Shutting down...');
    console.log(`  Active workers: ${this.activeWorkers}`);
    console.log(`  Queue size: ${this.queue.length}`);

    const shutdownPromises = this.workers.map(worker => {
      return new Promise<void>((resolve) => {
        worker.on('exit', () => resolve());
        worker.terminate();
      });
    });

    await Promise.all(shutdownPromises);
    this.workers = [];
    this.activeWorkers = 0;
    console.log('Thread Manager: Shutdown complete');
  }
}
