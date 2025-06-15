import { RECORD_HEADER, SUBRECORD_HEADER, OFFSETS } from "./buffer.constants";
import { RecordHeader, SubrecordHeader } from "../types";
import { debugLog } from "./debugUtils";

/**
 * Low-level record parsing utilities
 */

/**
 * Parse a record header from a buffer
 */
export function parseRecordHeader(buffer: Buffer): RecordHeader {
  if (buffer.length === 0) {
    throw new Error("Empty buffer provided to parseRecordHeader");
  }
  if (buffer.length < RECORD_HEADER.TOTAL_SIZE) {
    throw new Error(
      `Buffer too small for record header: ${buffer.length} < ${RECORD_HEADER.TOTAL_SIZE}`
    );
  }

  return {
    type: buffer.toString(
      "utf8",
      RECORD_HEADER.OFFSETS.TYPE,
      RECORD_HEADER.OFFSETS.TYPE + 4
    ),
    dataSize: buffer.readUInt32LE(RECORD_HEADER.OFFSETS.SIZE),
    flags: buffer.readUInt32LE(RECORD_HEADER.OFFSETS.FLAGS),
    formId: buffer.readUInt32LE(RECORD_HEADER.OFFSETS.FORM_ID),
    version: buffer.readUInt8(RECORD_HEADER.OFFSETS.VERSION),
    unknown: buffer.readUInt8(RECORD_HEADER.OFFSETS.UNKNOWN),
  };
}

/**
 * Parse a subrecord header from a buffer
 */
export function parseSubrecordHeader(buffer: Buffer): SubrecordHeader {
  if (buffer.length === 0) {
    throw new Error("Empty buffer provided to parseSubrecordHeader");
  }
  if (buffer.length < SUBRECORD_HEADER.TOTAL_SIZE) {
    throw new Error(
      `Buffer too small for subrecord header: ${buffer.length} < ${SUBRECORD_HEADER.TOTAL_SIZE}`
    );
  }

  return {
    type: buffer.toString(
      "utf8",
      OFFSETS.SUBRECORD.SIGNATURE,
      OFFSETS.SUBRECORD.SIGNATURE + SUBRECORD_HEADER.SIGNATURE_SIZE
    ),
    size: buffer.readUInt16LE(OFFSETS.SUBRECORD.SIZE),
  };
}

/**
 * Check if a subrecord type is valid (4 uppercase letters)
 */
function isValidSubrecordType(type: string): boolean {
  return /^[A-Z]{4}$/.test(type);
}

/**
 * Check if a subrecord size is suspicious
 */
function isSuspiciousSize(size: number, remainingBytes: number): boolean {
  // Size should be reasonable and not exceed remaining bytes
  return size === 0 || size > remainingBytes || size > 1000000; // Arbitrary large size limit
}

/**
 * Scan for subrecords in a buffer
 */
export function scanSubrecords(
  buffer: Buffer,
  startOffset: number
): { subrecords: { header: SubrecordHeader; offset: number }[] } {
  const subrecords: { header: SubrecordHeader; offset: number }[] = [];
  let offset = startOffset;

  debugLog(
    `[scanSubrecords] Starting scan at offset ${offset} with buffer length ${buffer.length}`
  );

  while (offset + SUBRECORD_HEADER.TOTAL_SIZE <= buffer.length) {
    const header = parseSubrecordHeader(buffer.slice(offset));
    const remainingBytes = buffer.length - offset - SUBRECORD_HEADER.TOTAL_SIZE;

    if (isSuspiciousSize(header.size, remainingBytes)) {
      debugLog(
        `[scanSubrecords] Suspicious subrecord at offset ${offset}: type=${header.type}, size=${header.size}, remaining=${remainingBytes}`
      );
      break;
    }

    subrecords.push({ header, offset });
    offset += SUBRECORD_HEADER.TOTAL_SIZE + header.size;
  }

  debugLog(`[scanSubrecords] Found ${subrecords.length} subrecords`);
  return { subrecords };
}
