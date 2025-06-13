// src/thread/pluginWorker.ts
import { parentPort } from 'worker_threads';
import { readFile, writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { PluginMeta } from '../types';
import { parseRecordHeader, scanSubrecords, setDebugCallback, hexDump } from '../utils/bufferParser';
import { 
  getRecordTypeAt, 
  parseGRUPHeader, 
  validateRecordSize, 
  validateGRUPSize,
  validateRecordType,
  formatBufferSlice
} from '../utils/recordUtils';
import { processGRUP } from '../utils/grup/grupHandler';
import { logGRUPFields } from '../utils/debugUtils';

if (!parentPort) {
  throw new Error('This module must be run as a worker thread');
}

// Set up debug callback immediately
setDebugCallback((message: string) => {
  parentPort?.postMessage({ type: 'debug', message });
});

/**
 * Send a log message to the main process
 */
function log(message: string, functionName: string = '') {
  const prefix = functionName ? `[${functionName}] ` : '';
  parentPort?.postMessage({ type: 'debug', message: `${prefix}${message}` });
}

/**
 * Convert buffer to hex string representation
 */
function bufferToHexString(buffer: Buffer): string {
  let hexString = '';
  for (let i = 0; i < buffer.length; i++) {
    hexString += buffer[i].toString(16).padStart(2, '0');
    if (i % 16 === 15) hexString += '\n';
    else if (i % 2 === 1) hexString += ' ';
  }
  return hexString;
}

interface PluginManifest {
  pluginName: string;
  recordCounts: {
    TES4: number;
    GRUP: number;
    NORMAL: number;
  };
  groups: {
    type: number;
    typeStr: string;
    count: number;
  }[];
  recordTypes: Record<string, number>;
}

/**
 * Process a GRUP record
 */
function processGRUPRecord(buffer: Buffer, offset: number, manifest: PluginManifest): { newOffset: number } {
  const header = parseGRUPHeader(buffer, offset);
  validateGRUPSize(header, buffer, offset);

  // Update manifest
  manifest.recordCounts.GRUP++;
  
  // Find or create group type entry
  let groupEntry = manifest.groups.find(g => g.type === header.groupType);
  if (!groupEntry) {
    groupEntry = {
      type: header.groupType,
      typeStr: header.groupTypeStr,
      count: 0
    };
    manifest.groups.push(groupEntry);
  }
  groupEntry.count++;

  // Process GRUP using new handler
  const records = processGRUP(buffer, offset, manifest.pluginName);
  
  // Add records to manifest
  records.forEach(record => {
    manifest.recordCounts.NORMAL++;
    if (!manifest.recordTypes[record.meta.type]) {
      manifest.recordTypes[record.meta.type] = 0;
    }
    manifest.recordTypes[record.meta.type]++;
  });

  // Calculate new offset with alignment
  const newOffset = offset + header.size;
  return { newOffset };
}

/**
 * Process a TES4 record
 */
function processTES4(buffer: Buffer, offset: number, manifest: PluginManifest): { newOffset: number } {
  const header = parseRecordHeader(buffer.slice(offset, offset + 20));
  validateRecordSize(header, buffer, offset);

  // Update manifest
  manifest.recordCounts.TES4++;

  // Calculate new offset with alignment
  const newOffset = offset + 20 + header.dataSize;
  
  // Look ahead to find next valid record
  let lookaheadOffset = newOffset;
  const maxLookahead = 64; // Maximum bytes to look ahead
  let foundValidRecord = false;

  while (lookaheadOffset < newOffset + maxLookahead && lookaheadOffset + 8 <= buffer.length) {
    const recordType = getRecordTypeAt(buffer, lookaheadOffset);
    if (recordType !== 'UNKNOWN') {
      foundValidRecord = true;
      break;
    }
    lookaheadOffset += 1; // Try next byte alignment
  }

  if (foundValidRecord) {
    log(`Found valid record at offset ${lookaheadOffset} after lookahead`, 'processTES4');
    return { newOffset: lookaheadOffset };
  }

  return { newOffset };
}

/**
 * Process a normal record
 */
function processNormalRecord(buffer: Buffer, offset: number, manifest: PluginManifest): { newOffset: number } {
  const header = parseRecordHeader(buffer.slice(offset, offset + 20));
  validateRecordSize(header, buffer, offset);

  // Update manifest
  manifest.recordCounts.NORMAL++;
  if (!manifest.recordTypes[header.type]) {
    manifest.recordTypes[header.type] = 0;
  }
  manifest.recordTypes[header.type]++;

  // Calculate new offset with alignment
  const newOffset = offset + 20 + header.dataSize;
  return { newOffset };
}

/**
 * Process a plugin file
 */
async function processPlugin(plugin: PluginMeta): Promise<void> {
  let currentBuffer: Buffer | null = null;
  let currentOffset = 0;

  try {
    // Read plugin file
    currentBuffer = await readFile(plugin.fullPath);
    log(`Processing plugin: ${plugin.name}`, 'processPlugin');



    // Initialize manifest
    const manifest: PluginManifest = {
      pluginName: plugin.name,
      recordCounts: {
        TES4: 0,
        GRUP: 0,
        NORMAL: 0
      },
      groups: [],
      recordTypes: {}
    };

    // Process records
    currentOffset = 0;
    while (currentOffset < currentBuffer.length) {
      try {
        const recordType = getRecordTypeAt(currentBuffer, currentOffset);
        log(`Found record type at offset ${currentOffset}: ${recordType}`, 'processPlugin');
        
        let result: { newOffset: number };

        switch (recordType) {
          case 'GRUP':
            result = processGRUPRecord(currentBuffer, currentOffset, manifest);
            break;
          case 'TES4':
            result = processTES4(currentBuffer, currentOffset, manifest);
            break;
          default:
            result = processNormalRecord(currentBuffer, currentOffset, manifest);
        }

        currentOffset = result.newOffset;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        log(`[ERROR] Failed at offset ${currentOffset}: ${errorMessage}`, 'processPlugin');
        log(`Hex dump with context:`, 'processPlugin');
        const hexLines = hexDump(currentBuffer, currentOffset, 32);
        hexLines.forEach((line: string) => log(line, 'processPlugin'));
        throw error; // Re-throw to be caught by outer try-catch
      }
    }

    // Print manifest summary
    log(`\nPlugin Summary: ${plugin.name}`, 'processPlugin');
    log(`Record Counts:`, 'processPlugin');
    log(`  TES4: ${manifest.recordCounts.TES4}`, 'processPlugin');
    log(`  GRUP: ${manifest.recordCounts.GRUP}`, 'processPlugin');
    log(`  Normal Records: ${manifest.recordCounts.NORMAL}`, 'processPlugin');
    log(`Group Types:`, 'processPlugin');
    manifest.groups.forEach(group => {
      log(`  ${group.typeStr}: ${group.count}`, 'processPlugin');
    });
    log(`Record Types:`, 'processPlugin');
    Object.entries(manifest.recordTypes).forEach(([type, count]) => {
      log(`  ${type}: ${count}`, 'processPlugin');
    });

    // Send completion message
    parentPort?.postMessage({ 
      type: 'done',
      plugin: plugin.name,
      manifest
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    log(`[ERROR] Failed to process plugin ${plugin.name}: ${errorMessage}`, 'processPlugin');
    if (currentBuffer) {
      const hexLines = hexDump(currentBuffer, currentOffset, 32);
      hexLines.forEach((line: string) => log(line, 'processPlugin'));
    }
    parentPort?.postMessage({ 
      type: 'error', 
      error: errorMessage,
      plugin: plugin.name
    });
  }
}

// Main worker message handler
parentPort?.on('message', async (message: { type: string; plugin: PluginMeta }) => {
  if (message.type === 'process') {
    await processPlugin(message.plugin);
  }
});

export { processPlugin };
