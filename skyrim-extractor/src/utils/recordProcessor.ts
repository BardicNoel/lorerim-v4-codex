import { ParsedRecord, RecordHeader } from "../types";
import {
  RECORD_HEADER,
  SUBRECORD_HEADER,
} from "../binary-decoders/buffer.constants";
import {
  parseRecordHeader,
  scanSubrecords,
  extractSubrecordDataAsBase64,
} from "../binary-decoders/recordParser";

import { PROCESSED_RECORD_TYPES, ProcessedRecordType } from "../constants";
import { debugLog } from "./debugUtils";
import { formatFormId } from "@lorerim/platform-types";

/**
 * Check if a record type should be processed
 */
export function shouldProcessRecordType(type: string): boolean {
  const shouldProcess = PROCESSED_RECORD_TYPES.has(type as ProcessedRecordType);
  if (!shouldProcess) {
    debugLog(`[recordProcessor] Skipping unsupported record type: ${type}`);
  }
  return shouldProcess;
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
    const newOffset = offset + RECORD_HEADER.TOTAL_SIZE + header.dataSize;
    // stats.recordSkipped(
    //   header.type,
    //   header.dataSize + RECORD_HEADER.TOTAL_SIZE
    // );
    debugLog(
      `[recordProcessor] Skipping record type ${header.type} at offset ${offset}, advancing to ${newOffset}`
    );
    return {
      record: null,
      newOffset,
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
      header: JSON.stringify(
        buffer
          .slice(offset, offset + RECORD_HEADER.TOTAL_SIZE)
          .toString("base64")
      ),
    };

    return {
      record,
      newOffset: offset + RECORD_HEADER.TOTAL_SIZE, // Only advance by header size
    };
  }

  // Process records with data
  const recordData = buffer.slice(
    offset + RECORD_HEADER.TOTAL_SIZE,
    offset + RECORD_HEADER.TOTAL_SIZE + header.dataSize
  );

  // Scan subrecords
  const { subrecords } = scanSubrecords(recordData, 0);
  if (!subrecords || subrecords.length === 0) {
    debugLog(
      `[recordProcessor] Failed to scan subrecords at offset ${offset} (type: ${header.type})`
    );
    return {
      record: null,
      newOffset: offset + RECORD_HEADER.TOTAL_SIZE + header.dataSize,
    };
  }

  // Create record with subrecord data
  const record: ParsedRecord = {
    meta: {
      type: header.type,
      formId: header.formId.toString(16).toUpperCase().padStart(8, "0"),
      plugin: pluginName,
    },
    data: {},
    header: JSON.stringify(
      buffer.slice(offset, offset + RECORD_HEADER.TOTAL_SIZE).toString("base64")
    ),
  };

  // Process each subrecord
  for (const subrecord of subrecords) {
    const type = subrecord.header.type;
    const subrecordData = extractSubrecordDataAsBase64(
      recordData,
      subrecord.offset,
      subrecord.header.size
    );
    if (!record.data[type]) {
      record.data[type] = [];
    }
    record.data[type].push(JSON.stringify(subrecordData));
  }

  const newOffset = offset + RECORD_HEADER.TOTAL_SIZE + header.dataSize;
  debugLog(
    `[recordProcessor] Processed record at offset ${offset}, advancing to ${newOffset}`
  );
  return {
    record,
    newOffset,
  };
}
