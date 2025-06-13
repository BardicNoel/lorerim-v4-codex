import { parseRecordHeader, scanSubrecords } from './utils/bufferParser';
import { ParsedRecord } from './types';
import { RECORD_HEADER } from './utils/buffer.constants';

export { parseRecordHeader };

export function parseRecord(buffer: Buffer, offset: number, pluginName: string): { record: ParsedRecord, newOffset: number } {
  const header = parseRecordHeader(buffer.slice(offset, offset + RECORD_HEADER.TOTAL_SIZE));
  const data = buffer.slice(offset + RECORD_HEADER.TOTAL_SIZE, offset + RECORD_HEADER.TOTAL_SIZE + header.dataSize);
  
  const subrecords: Record<string, Buffer[]> = {};

  for (const subrecord of scanSubrecords(data)) {
    if (!subrecords[subrecord.type]) {
      subrecords[subrecord.type] = [];
    }
    subrecords[subrecord.type].push(subrecord.data);
  }

  const record: ParsedRecord = {
    meta: {
      type: header.type,
      formId: header.formId,
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

export function processPlugin(pluginBuffer: Buffer, pluginName: string): Record<string, ParsedRecord[]> {
  const records: ParsedRecord[] = [];
  let offset = 0;

  while (offset + RECORD_HEADER.TOTAL_SIZE <= pluginBuffer.length) {
    const { record, newOffset } = parseRecord(pluginBuffer, offset, pluginName);
    records.push(record);
    offset = newOffset;
  }

  // Group records by type
  return records.reduce((acc, record) => {
    if (!acc[record.meta.type]) {
      acc[record.meta.type] = [];
    }
    acc[record.meta.type].push(record);
    return acc;
  }, {} as Record<string, ParsedRecord[]>);
}

export function parsePluginRecords(pluginBuffer: Buffer, pluginName: string): ParsedRecord[] {
  const records: ParsedRecord[] = [];
  let offset = 0;

  while (offset + RECORD_HEADER.TOTAL_SIZE <= pluginBuffer.length) {
    const { record, newOffset } = parseRecord(pluginBuffer, offset, pluginName);
    records.push(record);
    offset = newOffset;
  }

  return records;
}

export function groupRecordsByType(records: ParsedRecord[]): Record<string, ParsedRecord[]> {
  return records.reduce((acc, record) => {
    if (!acc[record.meta.type]) {
      acc[record.meta.type] = [];
    }
    acc[record.meta.type].push(record);
    return acc;
  }, {} as Record<string, ParsedRecord[]>);
} 