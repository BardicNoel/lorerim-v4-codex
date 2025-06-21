import { decompressRecordData, autoDecompressRecordData, isRecordCompressed } from './record-decompressor';
import { parseRecordFlags } from './header-flags';

/**
 * Example: How to use the record decompressor
 */
export function exampleUsage() {
  // Example 1: Manual decompression with known compression state
  function processRecordManually(buffer: Buffer, dataSize: number, isCompressed: boolean) {
    const result = decompressRecordData(buffer, dataSize, isCompressed);
    
    if (result.success) {
      console.log(`Successfully processed record data`);
      console.log(`Original size: ${result.originalSize} bytes`);
      console.log(`Decompressed size: ${result.decompressedSize} bytes`);
      
      // Now you can parse the decompressed data for subrecords
      return result.data;
    } else {
      console.error(`Failed to process record: ${result.error}`);
      return null;
    }
  }

  // Example 2: Automatic compression detection and decompression
  function processRecordAuto(buffer: Buffer, dataSize: number) {
    const result = autoDecompressRecordData(buffer, dataSize);
    
    if (result.success) {
      console.log(`Auto-detected and processed record data`);
      return result.data;
    } else {
      console.error(`Auto-processing failed: ${result.error}`);
      return null;
    }
  }

  // Example 3: Check compression status before processing
  function processRecordWithCheck(buffer: Buffer, dataSize: number) {
    const compressed = isRecordCompressed(buffer);
    console.log(`Record is ${compressed ? 'compressed' : 'uncompressed'}`);
    
    if (compressed) {
      console.log('Processing compressed record...');
    } else {
      console.log('Processing uncompressed record...');
    }
    
    return autoDecompressRecordData(buffer, dataSize);
  }

  // Example 4: Batch processing multiple records
  function processRecordBatch(records: Array<{ buffer: Buffer; dataSize: number }>) {
    const results = [];
    
    for (const record of records) {
      const result = autoDecompressRecordData(record.buffer, record.dataSize);
      
      if (result.success) {
        results.push({
          success: true,
          data: result.data,
          originalSize: result.originalSize,
          decompressedSize: result.decompressedSize
        });
      } else {
        results.push({
          success: false,
          error: result.error
        });
      }
    }
    
    return results;
  }

  return {
    processRecordManually,
    processRecordAuto,
    processRecordWithCheck,
    processRecordBatch
  };
}

/**
 * Example: Integration with record flag parsing
 */
export function exampleWithFlagParsing(buffer: Buffer, dataSize: number) {
  // First, parse the record flags to get additional information
  const flags = parseRecordFlags(buffer);
  
  console.log('Record Flags:');
  console.log(`- Deleted: ${flags.isDeleted}`);
  console.log(`- Persistent: ${flags.isPersistent}`);
  console.log(`- Disabled: ${flags.isDisabled}`);
  console.log(`- Compressed: ${flags.isCompressed}`);
  console.log(`- Distant LOD: ${flags.isDistantLOD}`);
  
  // Then decompress the data
  const decompressionResult = decompressRecordData(buffer, dataSize, flags.isCompressed);
  
  if (decompressionResult.success) {
    console.log(`Successfully decompressed ${decompressionResult.originalSize} bytes to ${decompressionResult.decompressedSize} bytes`);
    return decompressionResult.data;
  } else {
    console.error(`Decompression failed: ${decompressionResult.error}`);
    return null;
  }
} 