import { ParsedRecord, RecordHeader } from "../types";
import { RECORD_HEADER } from "./buffer.constants";
import { parseRecordHeader, scanSubrecords } from "./recordParser";
import {
  PROCESSED_RECORD_TYPES,
  ProcessedRecordType,
} from "../constants/recordTypes";
import { debugLog } from "./debugUtils";

/**
 * Check if a record type should be processed
 */
export function shouldProcessRecordType(type: string): boolean {
  return PROCESSED_RECORD_TYPES.has(type as ProcessedRecordType);
}

/**
 * Validate record size
 */
export function validateRecordSize(
  header: RecordHeader,
  buffer: Buffer,
  offset: number
): void {
  if (header.dataSize < 0) {
    throw new Error(`Invalid record data size: ${header.dataSize}`);
  }
  if (offset + RECORD_HEADER.TOTAL_SIZE + header.dataSize > buffer.length) {
    throw new Error(
      `Record size exceeds buffer length: ${
        offset + RECORD_HEADER.TOTAL_SIZE + header.dataSize
      } > ${buffer.length}`
    );
  }
}

/**
 * Process a single record from a plugin buffer
 * This is the shared implementation used by both main thread and worker threads
 */
export function processRecord(
  buffer: Buffer,
  offset: number,
  pluginName: string
): { record: ParsedRecord | null; newOffset: number } {
  // Check if we have enough bytes for a record header
  if (offset + RECORD_HEADER.TOTAL_SIZE > buffer.length) {
    debugLog(`[recordProcessor] Reached end of buffer at offset ${offset}`);
    return { record: null, newOffset: buffer.length };
  }

  const header = parseRecordHeader(
    buffer.slice(offset, offset + RECORD_HEADER.TOTAL_SIZE)
  );

  // Skip unsupported record types
  if (!shouldProcessRecordType(header.type)) {
    return {
      record: null,
      newOffset: offset + RECORD_HEADER.TOTAL_SIZE + header.dataSize,
    };
  }

  // Handle zero-size records
  if (header.dataSize === 0) {
    debugLog(
      `[recordProcessor] Zero-size record at offset ${offset} (type: ${
        header.type
      }, formId: ${header.formId.toString(16).padStart(8, "0")})`
    );

    // Create a record with no subrecords
    const record: ParsedRecord = {
      meta: {
        type: header.type,
        formId: header.formId.toString(16).toUpperCase().padStart(8, "0"),
        plugin: pluginName,
      },
      data: {}, // Empty data since there are no subrecords
      header: buffer
        .slice(offset, offset + RECORD_HEADER.TOTAL_SIZE)
        .toString("base64"),
    };

    return {
      record,
      newOffset: offset + RECORD_HEADER.TOTAL_SIZE, // Only advance by header size
    };
  }

  // Process records with data
  const data = buffer.slice(
    offset + RECORD_HEADER.TOTAL_SIZE,
    offset + RECORD_HEADER.TOTAL_SIZE + header.dataSize
  );

  const subrecords: Record<string, Buffer[]> = {};
  let subrecordOffset = 0;
  for (const subrecord of scanSubrecords(data, 0).subrecords) {
    if (!subrecords[subrecord.header.type]) {
      subrecords[subrecord.header.type] = [];
    }
    subrecords[subrecord.header.type].push(
      data.slice(subrecordOffset, subrecordOffset + subrecord.header.size)
    );
    subrecordOffset += subrecord.header.size;
  }

  const record: ParsedRecord = {
    meta: {
      type: header.type,
      formId: header.formId.toString(16).toUpperCase().padStart(8, "0"),
      plugin: pluginName,
    },
    data: subrecords,
    header: buffer
      .slice(offset, offset + RECORD_HEADER.TOTAL_SIZE)
      .toString("base64"),
  };

  return {
    record,
    newOffset: offset + RECORD_HEADER.TOTAL_SIZE + header.dataSize,
  };
}
