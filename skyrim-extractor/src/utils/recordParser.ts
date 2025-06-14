import { RECORD_HEADER, SUBRECORD_HEADER } from './buffer.constants';
import { RecordHeader, SubrecordHeader } from '../types';

/**
 * Low-level record parsing utilities
 */

/**
 * Parse a record header from a buffer
 */
export function parseRecordHeader(buffer: Buffer): RecordHeader {
  if (buffer.length < RECORD_HEADER.TOTAL_SIZE) {
    throw new Error(`Buffer too small for record header: ${buffer.length} < ${RECORD_HEADER.TOTAL_SIZE}`);
  }

  return {
    type: buffer.toString('utf8', RECORD_HEADER.OFFSETS.TYPE, RECORD_HEADER.OFFSETS.TYPE + 4),
    dataSize: buffer.readUInt32LE(RECORD_HEADER.OFFSETS.SIZE),
    flags: buffer.readUInt32LE(RECORD_HEADER.OFFSETS.FLAGS),
    formId: buffer.readUInt32LE(RECORD_HEADER.OFFSETS.FORM_ID),
    version: buffer.readUInt8(RECORD_HEADER.OFFSETS.VERSION),
    unknown: buffer.readUInt8(RECORD_HEADER.OFFSETS.UNKNOWN)
  };
}

/**
 * Parse a subrecord header from a buffer
 */
export function parseSubrecordHeader(buffer: Buffer): SubrecordHeader {
  if (buffer.length < SUBRECORD_HEADER.TOTAL_SIZE) {
    throw new Error(`Buffer too small for subrecord header: ${buffer.length} < ${SUBRECORD_HEADER.TOTAL_SIZE}`);
  }

  return {
    type: buffer.toString('utf8', 0, 4),
    size: buffer.readUInt16LE(4)
  };
}

/**
 * Scan subrecords in a buffer
 */
export function scanSubrecords(buffer: Buffer, startOffset: number): { offset: number; subrecords: SubrecordHeader[] } {
  const subrecords: SubrecordHeader[] = [];
  let offset = startOffset;

  while (offset + SUBRECORD_HEADER.TOTAL_SIZE <= buffer.length) {
    const header = parseSubrecordHeader(buffer.slice(offset));
    subrecords.push(header);
    offset += SUBRECORD_HEADER.TOTAL_SIZE + header.size;
  }

  return { offset, subrecords };
}

/**
 * Validate record size
 */
export function validateRecordSize(header: RecordHeader, buffer: Buffer, offset: number): void {
  if (offset + RECORD_HEADER.TOTAL_SIZE + header.dataSize > buffer.length) {
    throw new Error(`Record size ${header.dataSize} exceeds buffer length at offset ${offset}`);
  }
} 