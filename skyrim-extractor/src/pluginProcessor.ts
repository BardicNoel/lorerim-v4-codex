import { parseRecordHeader as parseRecordHeaderFromBuffer, scanSubrecords } from './utils/recordParser';
import { ParsedRecord, RecordHeader } from './types';
import { RECORD_HEADER } from './utils/buffer.constants';
import { PROCESSED_RECORD_TYPES, ProcessedRecordType } from './constants/recordTypes';
import { StatsCollector } from './utils/stats';

// Create a singleton stats collector
const statsCollector = new StatsCollector();

/**
 * High-level plugin processing functions
 */

/**
 * Parse a record header from a buffer
 */
export function parseRecordHeader(buffer: Buffer): RecordHeader {
  return parseRecordHeaderFromBuffer(buffer);
}

/**
 * Check if a record type should be processed
 */
export function shouldProcessRecordType(type: string): boolean {
  const shouldProcess = PROCESSED_RECORD_TYPES.has(type as ProcessedRecordType);
  if (!shouldProcess) {
    statsCollector.recordSkipped(type);
  }
  return shouldProcess;
}

/**
 * Validate record size
 */
export function validateRecordSize(header: RecordHeader, buffer: Buffer, offset: number): void {
  if (header.dataSize < 0) {
    throw new Error(`Invalid record data size: ${header.dataSize}`);
  }
  if (offset + RECORD_HEADER.TOTAL_SIZE + header.dataSize > buffer.length) {
    throw new Error(`Record size exceeds buffer length: ${offset + RECORD_HEADER.TOTAL_SIZE + header.dataSize} > ${buffer.length}`);
  }
}

/**
 * Process a single record from a plugin buffer
 */
export function processRecord(buffer: Buffer, offset: number, pluginName: string): { record: ParsedRecord | null, newOffset: number } {
  const header = parseRecordHeader(buffer.slice(offset, offset + RECORD_HEADER.TOTAL_SIZE));
  
  // Skip unsupported record types
  if (!shouldProcessRecordType(header.type)) {
    return {
      record: null,
      newOffset: offset + RECORD_HEADER.TOTAL_SIZE + header.dataSize
    };
  }

  const data = buffer.slice(offset + RECORD_HEADER.TOTAL_SIZE, offset + RECORD_HEADER.TOTAL_SIZE + header.dataSize);
  
  const subrecords: Record<string, Buffer[]> = {};
  let subrecordOffset = 0;
  for (const subrecord of scanSubrecords(data, 0).subrecords) {
    if (!subrecords[subrecord.type]) {
      subrecords[subrecord.type] = [];
    }
    subrecords[subrecord.type].push(data.slice(subrecordOffset, subrecordOffset + subrecord.size));
    subrecordOffset += subrecord.size;
  }

  const record: ParsedRecord = {
    meta: {
      type: header.type,
      formId: header.formId.toString(16).toUpperCase().padStart(8, '0'),
      plugin: pluginName
    },
    data: subrecords,
    header: buffer.slice(offset, offset + RECORD_HEADER.TOTAL_SIZE).toString('base64')
  };

  // Record stats for this record
  statsCollector.recordProcessed(header.type, RECORD_HEADER.TOTAL_SIZE + header.dataSize);

  return {
    record,
    newOffset: offset + RECORD_HEADER.TOTAL_SIZE + header.dataSize
  };
}

/**
 * Process an entire plugin file and return records grouped by type
 */
export function processPlugin(pluginBuffer: Buffer, pluginName: string): Record<string, ParsedRecord[]> {
  try {
    const records: ParsedRecord[] = [];
    let offset = 0;

    while (offset + RECORD_HEADER.TOTAL_SIZE <= pluginBuffer.length) {
      const { record, newOffset } = processRecord(pluginBuffer, offset, pluginName);
      if (record) {
        records.push(record);
      }
      offset = newOffset;
    }

    statsCollector.recordPluginProcessed();
    return groupRecordsByType(records);
  } catch (error) {
    statsCollector.recordError(error instanceof Error ? error.name : 'Unknown');
    throw error;
  }
}

/**
 * Group records by their type
 */
export function groupRecordsByType(records: ParsedRecord[]): Record<string, ParsedRecord[]> {
  return records.reduce((acc, record) => {
    if (!acc[record.meta.type]) {
      acc[record.meta.type] = [];
    }
    acc[record.meta.type].push(record);
    return acc;
  }, {} as Record<string, ParsedRecord[]>);
}

// Export the stats collector instance
export { statsCollector as stats }; 