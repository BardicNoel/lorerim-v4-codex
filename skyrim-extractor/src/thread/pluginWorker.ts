// src/thread/pluginWorker.ts
import { parentPort } from 'worker_threads';
import fs from 'fs';
import { PluginMeta } from '../types';
import { parseRecordHeader, scanSubrecords } from '../utils/bufferParser';

if (!parentPort) {
  throw new Error('This module must be run as a worker thread');
}

parentPort.on('message', async (message: { type: string; plugin: PluginMeta }) => {
  if (message.type !== 'process') {
    throw new Error(`Unknown message type: ${message.type}`);
  }

  const { plugin } = message;
  console.log(`\nWorker: Starting to process ${plugin.name}`);
  console.log(`  Reading file: ${plugin.fullPath}`);

  try {
    const buffer = fs.readFileSync(plugin.fullPath);
    console.log(`  File size: ${buffer.length} bytes`);
    let offset = 0;
    let recordCount = 0;

    while (offset + 20 <= buffer.length) {
      // Parse record header
      const headerBuf = buffer.slice(offset, offset + 20);
      const header = parseRecordHeader(headerBuf);
      offset += 20;

      // Parse subrecords
      const subrecords: Record<string, Buffer[]> = {};
      const subrecordBuffer = buffer.slice(offset, offset + header.dataSize);
      
      console.log(`  Processing ${header.type} record at offset ${offset}`);
      console.log(`    FormID: ${header.formId}`);
      console.log(`    Data size: ${header.dataSize} bytes`);
      
      for (const subrecord of scanSubrecords(subrecordBuffer)) {
        if (!subrecords[subrecord.type]) {
          subrecords[subrecord.type] = [];
        }
        subrecords[subrecord.type].push(subrecord.data);
      }

      // Send record to main thread
      parentPort?.postMessage({
        type: 'record',
        record: {
          meta: {
            type: header.type,
            formId: header.formId,
            plugin: plugin.name
          },
          data: subrecords,
          header: headerBuf.toString('base64')
        }
      });

      offset += header.dataSize;
      recordCount++;

      // Log progress every 100 records
      if (recordCount % 100 === 0) {
        console.log(`  Processed ${recordCount} records...`);
      }
    }

    console.log(`\nWorker: Completed processing ${plugin.name}`);
    console.log(`  Total records: ${recordCount}`);
    console.log(`  Final offset: ${offset}`);
    parentPort?.postMessage({ type: 'done' });

  } catch (error) {
    console.error(`\nWorker: Error processing ${plugin.name}:`, error);
    parentPort?.postMessage({ 
      type: 'error', 
      error: error instanceof Error ? error.message : 'Unknown error',
      plugin: plugin.name
    });
  }
});
