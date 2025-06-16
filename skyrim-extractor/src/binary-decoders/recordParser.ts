import {
  RECORD_HEADER,
  SUBRECORD_HEADER,
  OFFSETS,
} from "../utils/buffer.constants";
import { RecordHeader, SubrecordHeader } from "../types";
import { debugLog } from "../utils/debugUtils";

/**
 * Low-level record parsing utilities
 */

const LARGE_RECORD_TYPES = [
  "WRLD",
  "CELL",
  "LAND",
  "NAVM",
  "NAVI",
  "NAVQ",
  "GRUP",
];

/**
 * Check if a record header is valid
 */
function isValidRecordHeader(header: RecordHeader): boolean {
  // For GRUP records, only check type length
  if (LARGE_RECORD_TYPES.includes(header.type)) {
    return header.type.length === 4;
  }
  // For other records, check both type length and size
  return header.type.length === 4 && header.dataSize < 10000;
}

// Counter for invalid headers
let invalidHeaderCount = 0;

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

  const header = {
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

  if (!isValidRecordHeader(header) && invalidHeaderCount < 10) {
    invalidHeaderCount++;
    debugLog(
      `[parseRecordHeader] Invalid record header detected (${invalidHeaderCount}):`
      // `[parseRecordHeader] Invalid record header detected (${invalidHeaderCount}/10):`
    );
    debugLog(
      `  Type: "${header.type}" (length: ${header.type.length}, should be 4)`
    );
    if (!LARGE_RECORD_TYPES.includes(header.type)) {
      debugLog(`  Size: ${header.dataSize} (should be < 10000)`);
    }
    debugLog(`  FormId: ${header.formId.toString(16).padStart(8, "0")}`);
    debugLog(`  Hex preview: ${getHexPreview(buffer, 0, 32)}`);
  }

  return header;
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

  const header = {
    type: buffer.toString(
      "utf8",
      OFFSETS.SUBRECORD.SIGNATURE,
      OFFSETS.SUBRECORD.SIGNATURE + SUBRECORD_HEADER.SIGNATURE_SIZE
    ),
    size: buffer.readUInt16LE(OFFSETS.SUBRECORD.SIZE),
  };

  return header;
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
 * Get a hex preview of buffer contents
 */
function getHexPreview(buffer: Buffer, offset: number, length: number): string {
  const preview = buffer.slice(offset, offset + length);
  return (
    preview
      .toString("hex")
      .match(/.{1,2}/g)
      ?.join(" ") || ""
  );
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

  // debugLog(
  //   `[scanSubrecords] Starting scan at offset ${offset} with buffer length ${buffer.length}`
  // );

  while (offset + SUBRECORD_HEADER.TOTAL_SIZE <= buffer.length) {
    const header = parseSubrecordHeader(buffer.slice(offset));
    const remainingBytes = buffer.length - offset - SUBRECORD_HEADER.TOTAL_SIZE;

    // // Special handling for EDID subrecords
    if (header.type === "FULL") {
      const dataOffset = offset + SUBRECORD_HEADER.TOTAL_SIZE;
      const edidData = buffer.slice(dataOffset, dataOffset + header.size);
      const edidString = edidData.toString("utf8").replace(/\0/g, "");
      debugLog(`[scanSubrecords] Found FULL subrecord at offset ${offset}:`);
      debugLog(`  dataSize: ${dataOffset + header.size}`);
      debugLog(`  Size: ${header.size}`);
      debugLog(`  Data: "${edidString}"`);
      debugLog(`  raw: ${edidData.toString("utf8")}\n`);
      debugLog(
        `  Hex: ${getHexPreview(buffer, dataOffset, Math.min(header.size, 32))}`
      );
    }

    if (isSuspiciousSize(header.size, remainingBytes)) {
      debugLog(
        `[scanSubrecords] Suspicious subrecord at offset ${offset}: type=${header.type}, size=${header.size}, remaining=${remainingBytes}`
      );
      debugLog(`  Hex preview: ${getHexPreview(buffer, offset, 32)}`);
      break;
    }

    if (!isValidSubrecordType(header.type)) {
      debugLog(
        `[scanSubrecords] Invalid subrecord type at offset ${offset}: type=${header.type}`
      );
      debugLog(`  Hex preview: ${getHexPreview(buffer, offset, 32)}`);
      break;
    }

    subrecords.push({ header, offset });
    offset += SUBRECORD_HEADER.TOTAL_SIZE + header.size;
  }

  debugLog(`[scanSubrecords] Found ${subrecords.length} subrecords`);
  return { subrecords };
}

/**
 * Extract subrecord data and convert to base64 string
 * Used by GRUP processing
 */
export function extractSubrecordDataAsBase64(
  buffer: Buffer,
  offset: number,
  size: number
): string {
  return buffer
    .subarray(
      offset + SUBRECORD_HEADER.TOTAL_SIZE,
      offset + SUBRECORD_HEADER.TOTAL_SIZE + size
    )
    .toString("base64");
}
