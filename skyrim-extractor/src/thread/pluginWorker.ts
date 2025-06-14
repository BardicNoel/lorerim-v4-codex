// src/thread/pluginWorker.ts
import { parentPort } from 'worker_threads';
import { readFile } from 'fs/promises';
import { PluginMeta, ParsedRecord } from '../types';
import { processGRUP } from '../utils/grup/grupHandler';
import { logGRUPFields } from '../utils/debugUtils';
import { RECORD_HEADER, GRUP_HEADER } from '../utils/buffer.constants';
import { parseRecordHeader, scanSubrecords } from '../utils/recordParser';

interface ProcessResult {
  records: ParsedRecord[];
  newOffset: number;
}

// Debug logging function
function debugLog(message: string, data?: any) {
  if (parentPort) {
    parentPort.postMessage({ type: 'debug', message, data });
  }
}

// Error logging function
function errorLog(message: string, error?: any) {
  if (parentPort) {
    parentPort.postMessage({ type: 'error', message, error: error?.message || error });
  }
}

// Process a GRUP record
async function processGRUPRecord(buffer: Buffer, offset: number, pluginName: string): Promise<ProcessResult> {
  debugLog(`Processing GRUP at offset ${offset}`);
  const parsedRecords = await processGRUP(buffer, offset, pluginName);
  debugLog(`GRUP processed, found ${parsedRecords.length} records`);
  return {
    records: parsedRecords,
    newOffset: offset + GRUP_HEADER.TOTAL_SIZE
  };
}

// Process a TES4 record
async function processTES4Record(buffer: Buffer, offset: number, pluginName: string): Promise<ProcessResult> {
  debugLog(`Processing TES4 record at offset ${offset}`);
  const records: ParsedRecord[] = [];
  const header = buffer.slice(offset, offset + RECORD_HEADER.TOTAL_SIZE);
  const size = header.readUInt32LE(RECORD_HEADER.OFFSETS.SIZE);
  const newOffset = offset + RECORD_HEADER.TOTAL_SIZE + size;
  debugLog(`TES4 record processed, size: ${size}`);
  return { records, newOffset };
}

// Process a normal record
async function processNormalRecord(buffer: Buffer, offset: number, pluginName: string): Promise<ProcessResult> {
  debugLog(`Processing normal record at offset ${offset}`);
  const records: ParsedRecord[] = [];
  const header = buffer.slice(offset, offset + RECORD_HEADER.TOTAL_SIZE);
  const size = header.readUInt32LE(RECORD_HEADER.OFFSETS.SIZE);
  const newOffset = offset + RECORD_HEADER.TOTAL_SIZE + size;
  debugLog(`Normal record processed, size: ${size}`);
  return { records, newOffset };
}

// Process the plugin file
export async function processPlugin(plugin: PluginMeta): Promise<ParsedRecord[]> {
  const records: ParsedRecord[] = [];
  const buffer = await readFile(plugin.fullPath);
  let offset = 0;

  // Log start of plugin processing
  console.log(`Processing plugin: ${plugin.name}`);

  while (offset < buffer.length) {
    const header = parseRecordHeader(buffer);
    if (!header) break;

    const subrecordResult = scanSubrecords(buffer.slice(offset + RECORD_HEADER.TOTAL_SIZE), 0);
    const record: ParsedRecord = {
      meta: {
        type: header.type,
        formId: header.formId.toString(16).padStart(8, '0').toUpperCase(),
        plugin: plugin.name
      },
      data: {},
      header: buffer.slice(offset, offset + RECORD_HEADER.TOTAL_SIZE).toString('base64')
    };

    for (const subrecord of subrecordResult.subrecords) {
      if (!record.data[subrecord.type]) {
        record.data[subrecord.type] = [];
      }
      // If needed, slice data from buffer using subrecord.size and offset
      // record.data[subrecord.type].push(buffer.slice(...));
    }
    records.push(record);
    offset += RECORD_HEADER.TOTAL_SIZE + header.dataSize;
  }

  // Log completion of plugin processing
  console.log(`Completed processing plugin: ${plugin.name}`);
  return records;
}

// Handle messages from the main thread
if (parentPort) {
  parentPort.on('message', async (message: { plugin: PluginMeta }) => {
    try {
      debugLog(`Received plugin to process: ${message.plugin.name}`);
      const records = await processPlugin(message.plugin);
      debugLog(`Successfully processed ${message.plugin.name}`);
      if (parentPort) {
        parentPort.postMessage({ status: 'done', records });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      errorLog(`Error processing plugin ${message.plugin.name}`, errorMessage);
      if (parentPort) {
        parentPort.postMessage({ status: 'error', error: errorMessage });
      }
    }
  });
}
