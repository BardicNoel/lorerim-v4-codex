// src/thread/pluginWorker.ts
import { parentPort } from 'worker_threads';
import { readFile } from 'fs/promises';
import { PluginMeta } from '../types';
import { parseRecordHeader, scanSubrecords } from '../utils/bufferParser';
import { 
  getRecordTypeAt, 
  parseGRUPHeader, 
  validateRecordSize, 
  validateGRUPSize,
  validateRecordType,
  formatBufferSlice
} from '../utils/recordUtils';
import { hexDump, logGRUPFields } from '../utils/debugUtils';

if (!parentPort) {
  throw new Error('This module must be run as a worker thread');
}

/**
 * Send a log message to the main process
 */
function log(message: string) {
  parentPort?.postMessage({ type: 'log', message });
}

interface PluginManifest {
  name: string;
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
}

/**
 * Process a GRUP record
 */
function processGRUP(buffer: Buffer, offset: number, manifest: PluginManifest): { newOffset: number } {
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

  // Calculate new offset with alignment
  const newOffset = offset + header.size;
  return { newOffset };
}

/**
 * Process a TES4 record
 */
function processTES4(buffer: Buffer, offset: number, manifest: PluginManifest): { newOffset: number } {
  // For TES4, we already know it's valid from getRecordTypeAt
  const headerBuf = buffer.slice(offset, offset + 20);
  const header = parseRecordHeader(headerBuf);
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
    return { newOffset: lookaheadOffset };
  }

  return { newOffset };
}

/**
 * Process a normal record
 */
function processNormalRecord(buffer: Buffer, offset: number, manifest: PluginManifest): { newOffset: number } {
  const headerBuf = buffer.slice(offset, offset + 20);
  const header = parseRecordHeader(headerBuf);
  validateRecordSize(header, buffer, offset);

  // Update manifest
  manifest.recordCounts.NORMAL++;

  const newOffset = offset + 20 + header.dataSize;
  return { newOffset };
}

/**
 * Process a plugin file
 */
async function processPlugin(plugin: PluginMeta): Promise<void> {
  try {
    log(`\nProcessing plugin: ${plugin.name}`);
    const buffer = await readFile(plugin.fullPath);
    
    // Initialize manifest
    const manifest: PluginManifest = {
      name: plugin.name,
      recordCounts: {
        TES4: 0,
        GRUP: 0,
        NORMAL: 0
      },
      groups: []
    };

    let offset = 0;
    while (offset < buffer.length) {
      const recordType = getRecordTypeAt(buffer, offset);
      let result: { newOffset: number };

      switch (recordType) {
        case 'GRUP':
          result = processGRUP(buffer, offset, manifest);
          break;
        case 'TES4':
          result = processTES4(buffer, offset, manifest);
          break;
        case 'NORMAL':
          result = processNormalRecord(buffer, offset, manifest);
          break;
        default:
          log(`[ERROR] Unknown record type at offset ${offset}`);
          parentPort?.postMessage({ 
            type: 'error', 
            error: `Unknown record type at offset ${offset}`,
            plugin: plugin.name
          });
          return;
      }

      offset = result.newOffset;
    }

    // Print manifest summary
    log(`\nPlugin Summary: ${plugin.name}`);
    log(`Record Counts:`);
    log(`  TES4: ${manifest.recordCounts.TES4}`);
    log(`  GRUP: ${manifest.recordCounts.GRUP}`);
    log(`  Normal Records: ${manifest.recordCounts.NORMAL}`);
    log(`Group Types:`);
    manifest.groups.forEach(group => {
      log(`  ${group.typeStr}: ${group.count}`);
    });

    // Send completion message
    parentPort?.postMessage({ 
      type: 'done',
      plugin: plugin.name,
      manifest
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    log(`[ERROR] Failed to process plugin ${plugin.name}: ${errorMessage}`);
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
