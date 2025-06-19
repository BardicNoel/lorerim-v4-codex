import { inflateSync } from "zlib";
import { parseRecordFlags } from "./header-flags";

export interface DecompressionResult {
  success: boolean;
  data?: Buffer;
  error?: string;
  originalSize: number;
  decompressedSize?: number;
}

const KNOWN_TAGS = ["EDID", "FULL", "OBND", "DESC", "DATA", "CNAM", "XNAM"];

/**
 * Checks if data appears to be actually compressed by looking for zlib headers
 * @param data - Buffer containing the data to check
 * @returns Whether the data appears to be zlib compressed
 */
function isZlibCompressed(data: Buffer): boolean {
  if (data.length < 2) return false;

  // Check for zlib header: 0x78 followed by 0x01, 0x9C, or 0xDA
  return data[0] === 0x78 && [0x01, 0x9c, 0xda].includes(data[1]);
}

/**
 * Checks if data starts with a known Skyrim record tag
 * @param data - Buffer containing the data to check
 * @returns Whether the data starts with a known tag
 */
function startsWithKnownTag(data: Buffer): boolean {
  if (data.length < 4) return false;

  const tag = data.toString("ascii", 0, 4);
  return KNOWN_TAGS.includes(tag);
}

/**
 * Safely decompresses compressed record data from a Skyrim plugin buffer
 * This function checks for known tags and zlib headers before attempting decompression
 * to handle cases where plugins set incorrect compression flags.
 * @param buffer - Buffer containing the record data
 * @param dataSize - Size of the compressed data
 * @param isCompressed - Whether the data is compressed (can be auto-detected if not provided)
 * @returns Decompression result with success status and data
 */
export function decompressRecordData(
  buffer: Buffer,
  dataSize: number,
  isCompressed?: boolean
): DecompressionResult {
  try {
    // Validate input
    if (!Buffer.isBuffer(buffer)) {
      return {
        success: false,
        error: "Input must be a valid Buffer",
        originalSize: dataSize,
      };
    }

    if (dataSize <= 0) {
      return {
        success: false,
        error: "Data size must be positive",
        originalSize: dataSize,
      };
    }

    const headerLength = 0x18; // Standard Skyrim record header length

    // Check if buffer is large enough
    if (buffer.length < headerLength + dataSize) {
      return {
        success: false,
        error: `Buffer too small. Expected at least ${
          headerLength + dataSize
        } bytes, got ${buffer.length}`,
        originalSize: dataSize,
      };
    }

    // Auto-detect compression if not provided
    if (isCompressed === undefined) {
      const flags = parseRecordFlags(buffer);
      isCompressed = flags.isCompressed;
    }

    // Extract the data portion
    const data = buffer.slice(headerLength, headerLength + dataSize);

    // If not flagged as compressed, return as-is
    if (!isCompressed) {
      return {
        success: true,
        data: data,
        originalSize: dataSize,
        decompressedSize: dataSize,
      };
    }

    // Check if data starts with a known tag (indicates it's not actually compressed)
    if (startsWithKnownTag(data)) {
      return {
        success: true,
        data: data,
        originalSize: dataSize,
        decompressedSize: dataSize,
      };
    }

    // Check if data appears to be zlib compressed
    if (!isZlibCompressed(data)) {
      return {
        success: true,
        data: data,
        originalSize: dataSize,
        decompressedSize: dataSize,
      };
    }

    // Attempt to decompress using zlib
    const decompressedData = inflateSync(data);

    return {
      success: true,
      data: decompressedData,
      originalSize: dataSize,
      decompressedSize: decompressedData.length,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Unknown decompression error",
      originalSize: dataSize,
    };
  }
}

/**
 * Convenience function that automatically detects compression and decompresses
 * @param buffer - Buffer containing the record data
 * @param dataSize - Size of the data (compressed or uncompressed)
 * @returns Decompression result
 */
export function autoDecompressRecordData(
  buffer: Buffer,
  dataSize: number
): DecompressionResult {
  return decompressRecordData(buffer, dataSize);
}

/**
 * Utility function to check if a record is compressed without decompressing
 * @param buffer - Buffer containing the record header
 * @returns Whether the record data is compressed
 */
export function isRecordCompressed(buffer: Buffer): boolean {
  try {
    const flags = parseRecordFlags(buffer);
    return flags.isCompressed;
  } catch {
    return false;
  }
}

/**
 * Safely decompress Skyrim record data if actually compressed
 * This is a lower-level function that takes raw flags and data size
 * @param buffer Full record buffer including header
 * @param flags Flags from record header (offset 0x0C)
 * @param dataSize Size of the data field from header (offset 0x04)
 * @returns A Buffer containing uncompressed record data
 */
export function safeDecompressRecord(
  buffer: Buffer,
  flags: number,
  dataSize: number
): Buffer {
  const HEADER_SIZE = 0x18;
  const isFlaggedCompressed = (flags & 0x00040000) !== 0;

  const data = buffer.slice(HEADER_SIZE, HEADER_SIZE + dataSize);
  const tag = data.toString("ascii", 0, 4);
  const isKnownTag = KNOWN_TAGS.includes(tag);
  const startsWithZlib =
    data[0] === 0x78 && [0x01, 0x9c, 0xda].includes(data[1]);

  const shouldDecompress = isFlaggedCompressed && !isKnownTag && startsWithZlib;

  if (shouldDecompress) {
    try {
      return inflateSync(data);
    } catch (err) {
      console.warn(
        `⚠️ Decompression failed: ${err instanceof Error ? err.message : err}`
      );
      return data; // fallback: return raw data anyway
    }
  }

  // Not actually compressed
  return data;
}
