import { parentPort } from 'worker_threads';
import { PluginMeta } from '../types';
import { WorkerMessage } from './types';
import * as fs from 'fs';
import { scanAllBlocks } from './scanAllBlocks';

if (!parentPort) {
  throw new Error('This module must be run as a worker thread');
}

function sendLog(level: 'info' | 'debug', message: string): void {
  parentPort!.postMessage({ log: true, level, message } as WorkerMessage);
}

interface WorkerTask {
  plugin: PluginMeta;
  recordTypeFilter?: string[];
}

async function processPlugin(task: WorkerTask): Promise<void> {
  try {
    const { plugin, recordTypeFilter } = task;
    sendLog('info', `Scanning ${plugin.name}`);
    
    // Read the plugin file
    const buffer = await fs.promises.readFile(plugin.fullPath);
    
    // Scan all blocks in the plugin
    const results = await scanAllBlocks(buffer, {
      sourcePlugin: plugin.name,
      modFolder: plugin.modFolder,
      pluginIndex: plugin.index,
      recordTypeFilter,
      onLog: sendLog
    });

    sendLog('info', `Found ${results.length} records in ${plugin.name}`);
    
    // Send results back to main thread
    parentPort!.postMessage({ result: results } as WorkerMessage);
  } catch (error) {
    parentPort!.postMessage({ 
      error: `Failed to process ${task.plugin.name}: ${error instanceof Error ? error.message : String(error)}` 
    } as WorkerMessage);
  }
}

// Listen for messages from the main thread
parentPort.on('message', (task: WorkerTask) => {
  processPlugin(task).catch(error => {
    parentPort!.postMessage({ 
      error: `Unexpected error processing ${task.plugin.name}: ${error instanceof Error ? error.message : String(error)}` 
    } as WorkerMessage);
  });
}); 