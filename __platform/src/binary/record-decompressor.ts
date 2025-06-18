import { inflateSync } from 'zlib';
import { parseRecordFlags } from './header-flags';

export interface DecompressionResult {
  success: boolean;
  data?: Buffer;
  error?: string;
  originalSize: number;
  decompressedSize?: number;
}

/**
 * Decompresses compressed record data from a Skyrim plugin buffer
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
        originalSize: dataSize
      };
    }

    if (dataSize <= 0) {
      return {
        success: false,
        error: "Data size must be positive",
        originalSize: dataSize
      };
    }

    const headerLength = 0x18; // Standard Skyrim record header length
    
    // Check if buffer is large enough
    if (buffer.length < headerLength + dataSize) {
      return {
        success: false,
        error: `Buffer too small. Expected at least ${headerLength + dataSize} bytes, got ${buffer.length}`,
        originalSize: dataSize
      };
    }

    // Auto-detect compression if not provided
    if (isCompressed === undefined) {
      const flags = parseRecordFlags(buffer);
      isCompressed = flags.isCompressed;
    }

    // Extract the data portion
    const data = buffer.slice(headerLength, headerLength + dataSize);

    // If not compressed, return as-is
    if (!isCompressed) {
      return {
        success: true,
        data: data,
        originalSize: dataSize,
        decompressedSize: dataSize
      };
    }

    // Decompress using zlib
    const decompressedData = inflateSync(data);

    return {
      success: true,
      data: decompressedData,
      originalSize: dataSize,
      decompressedSize: decompressedData.length
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown decompression error",
      originalSize: dataSize
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