import { parseRecordHeader as parseRecordHeaderFromBuffer, scanSubrecords } from './utils/recordParser';
import { ParsedRecord, RecordHeader } from './types';
import { RECORD_HEADER } from './utils/buffer.constants';

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
export function processRecord(buffer: Buffer, offset: number, pluginName: string): { record: ParsedRecord, newOffset: number } {
  const header = parseRecordHeader(buffer.slice(offset, offset + RECORD_HEADER.TOTAL_SIZE));
  const data = buffer.slice(offset + RECORD_HEADER.TOTAL_SIZE, offset + RECORD_HEADER.TOTAL_SIZE + header.dataSize);
  
  const subrecords: Record<string, Buffer[]> = {};
  for (const subrecord of scanSubrecords(data, 0).subrecords) {
    if (!subrecords[subrecord.type]) {
      subrecords[subrecord.type] = [];
    }
    // If you need the data, slice it from the buffer using subrecord.size and the running offset.
    // For now, just group by type and count.
    // subrecords[subrecord.type].push(data.slice(...)); // implement if needed
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

  return {
    record,
    newOffset: offset + RECORD_HEADER.TOTAL_SIZE + header.dataSize
  };
}

/**
 * Process an entire plugin file and return records grouped by type
 */
export function processPlugin(pluginBuffer: Buffer, pluginName: string): Record<string, ParsedRecord[]> {
  const records: ParsedRecord[] = [];
  let offset = 0;

  while (offset + RECORD_HEADER.TOTAL_SIZE <= pluginBuffer.length) {
    const { record, newOffset } = processRecord(pluginBuffer, offset, pluginName);
    records.push(record);
    offset = newOffset;
  }

  return groupRecordsByType(records);
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