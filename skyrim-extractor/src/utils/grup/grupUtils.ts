import { parentPort } from 'worker_threads';
import { RECORD_HEADER } from '../buffer.constants';
import { Buffer } from 'buffer';
import { ParsedRecord } from '../../types';
import { parseRecordHeader, scanSubrecords } from '../recordParser';
import { ProcessedRecordType } from '../../constants/recordTypes';

  

/**
 * Send a debug message to the main process
 */
export function debugLog(message: string) {
  parentPort?.postMessage({ type: 'debug', message });
}

/**
 * Send an error message to the main process
 */
export function errorLog(functionName: string, message: string) {
  parentPort?.postMessage({ 
    type: 'error', 
    error: `[${functionName}] ${message}` 
  });
}

/**
 * Dump a section of the buffer in hex format
 */
export function dumpHex(buffer: Buffer, offset: number, length: number, context: string) {
  const hexLines = hexDump(buffer, offset, length);
  debugLog(`\n${context}:`);
  hexLines.forEach(line => debugLog(line));
}

/**
 * Convert buffer to hex string representation
 */
function hexDump(buffer: Buffer, start: number, length: number, context: number = 16): string[] {
  const lines: string[] = [];
  const end = Math.min(start + length, buffer.length);
  const contextStart = Math.max(0, start - context);
  const contextEnd = Math.min(buffer.length, end + context);

  // Add header
  lines.push('Hex dump with context:');
  lines.push('Offset   00 01 02 03 04 05 06 07 08 09 0A 0B 0C 0D 0E 0F  ASCII');
  lines.push('-------- ------------------------------------------------  ----------------');

  // Process each line (16 bytes per line)
  for (let i = contextStart; i < contextEnd; i += 16) {
    const lineEnd = Math.min(i + 16, contextEnd);
    const bytes = buffer.slice(i, lineEnd);

    // Format offset
    const offset = i.toString(16).padStart(8, '0');

    // Format hex values
    const hexValues = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join(' ');
    const hexPadding = '   '.repeat(16 - bytes.length);

    // Format ASCII
    const ascii = bytes.toString('ascii').replace(/[^\x20-\x7E]/g, '.');
    const asciiPadding = ' '.repeat(16 - ascii.length);

    // Add markers for the error region
    const isErrorRegion = i >= start && i < end;
    const marker = isErrorRegion ? '>>> ' : '    ';

    lines.push(`${marker}${offset}  ${hexValues}${hexPadding}  ${ascii}${asciiPadding}`);
  }

  return lines;
}

/**
 * Get the name of a GRUP type
 */
export function getGroupTypeName(type: number): string {
  const types: Record<number, string> = {
    0: 'Top-Level',
    1: 'World Children',
    2: 'Interior Cell Block',
    3: 'Interior Cell Sub-Block',
    4: 'Exterior Cell Block',
    5: 'Exterior Cell Sub-Block',
    6: 'Cell Children',
    7: 'Topic Children',
    8: 'Cell Persistent Children',
    9: 'Cell Temporary Children'
  };
  return types[type] || `Unknown (${type})`;
}

/**
 * Parse a GRUP header from a buffer
 */
export function parseGRUPHeader(buffer: Buffer, offset: number) {
  if (buffer.length < offset + RECORD_HEADER.TOTAL_SIZE) {
    throw new Error(`Buffer too small for GRUP header: ${buffer.length} < ${offset + RECORD_HEADER.TOTAL_SIZE}`);
  }

  const header = buffer.slice(offset, offset + RECORD_HEADER.TOTAL_SIZE);
  const type = header.toString('ascii', 0, 4);
  if (type !== 'GRUP') {
    throw new Error(`Invalid GRUP header type: ${type}`);
  }

  return {
    type: 'GRUP',
    size: header.readUInt32LE(4),
    groupType: header.readUInt32LE(8),
    groupTypeStr: getGroupTypeName(header.readUInt32LE(8)),
    label: header.slice(12, 16),
    timestamp: header.readUInt32LE(16),
    versionControl: header.readUInt32LE(20)
  };
}

/**
 * Validate GRUP size
 */
export function validateGRUPSize(header: any, buffer: Buffer, offset: number) {
  if (header.size < RECORD_HEADER.TOTAL_SIZE) {
    throw new Error(`GRUP size too small: ${header.size} < ${RECORD_HEADER.TOTAL_SIZE}`);
  }
  if (offset + header.size > buffer.length) {
    throw new Error(`GRUP size exceeds buffer length: ${offset + header.size} > ${buffer.length}`);
  }
}

/**
 * Process a GRUP record
 * @param buffer The buffer containing the GRUP record
 * @param offset The offset to start processing from
 * @param pluginName The name of the plugin being processed
 * @param processedTypes Set of record types to process
 * @returns The processed records and the new offset
 */
export function processGrupRecord(
  buffer: Buffer,
  offset: number,
  pluginName: string,
  processedTypes: Set<ProcessedRecordType>
): { records: ParsedRecord[], newOffset: number } {
  const records: ParsedRecord[] = [];
  let currentOffset = offset;

  // Read GRUP header
  const grupHeader = buffer.slice(currentOffset, currentOffset + RECORD_HEADER.TOTAL_SIZE);
  const header = parseRecordHeader(grupHeader);
  currentOffset += RECORD_HEADER.TOTAL_SIZE;

  // Process all records in the GRUP
  while (currentOffset < offset + header.dataSize) {
    const recordHeader = parseRecordHeader(buffer.slice(currentOffset, currentOffset + RECORD_HEADER.TOTAL_SIZE));
    
    // Skip unsupported record types
    if (!processedTypes.has(recordHeader.type as ProcessedRecordType)) {
      currentOffset += RECORD_HEADER.TOTAL_SIZE + recordHeader.dataSize;
      continue;
    }

    const data = buffer.slice(
      currentOffset + RECORD_HEADER.TOTAL_SIZE,
      currentOffset + RECORD_HEADER.TOTAL_SIZE + recordHeader.dataSize
    );

    const subrecords: Record<string, Buffer[]> = {};
    let subrecordOffset = 0;
    for (const subrecord of scanSubrecords(data, 0).subrecords) {
      if (!subrecords[subrecord.type]) {
        subrecords[subrecord.type] = [];
      }
      subrecords[subrecord.type].push(data.slice(subrecordOffset, subrecordOffset + subrecord.size));
      subrecordOffset += subrecord.size;
    }

    records.push({
      meta: {
        type: recordHeader.type,
        formId: recordHeader.formId.toString(16).toUpperCase().padStart(8, '0'),
        plugin: pluginName
      },
      data: subrecords,
      header: buffer.slice(currentOffset, currentOffset + RECORD_HEADER.TOTAL_SIZE).toString('base64')
    });

    currentOffset += RECORD_HEADER.TOTAL_SIZE + recordHeader.dataSize;
  }

  return { records, newOffset: offset + RECORD_HEADER.TOTAL_SIZE + header.dataSize };
} 