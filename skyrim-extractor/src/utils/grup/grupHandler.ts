import { ParsedRecord } from '../../types';
import { parseGRUPHeader, validateGRUPSize } from '../recordUtils';
import { parseRecord, parseRecordHeader } from '../../recordParser';
import { setDebugCallback } from '../bufferParser';
import { 
  PROCESSED_RECORD_TYPES, 
  RECORD_HEADER_SIZE, 
  debugLog, 
  dumpHex, 
  getGroupTypeName,
  errorLog 
} from './grupUtils';

// Set up debug callback
setDebugCallback((message: string) => {
  debugLog(message);
});

/**
 * Main GRUP processing function that handles all GRUP types.
 * 
 * GRUP Types:
 * 0 - Top-Level: Contains records of a single type (e.g., all RACE records)
 * 1 - World Children: Contains worldspace records
 * 2 - Interior Cell Block: Contains interior cell records
 * 3 - Interior Cell Sub-Block: Subdivision of interior cells
 * 4 - Exterior Cell Block: Contains exterior cell records
 * 5 - Exterior Cell Sub-Block: Subdivision of exterior cells
 * 6 - Cell Children: Contains cell-specific records
 * 7 - Topic Children: Contains dialogue topic records
 * 8 - Cell Persistent Children: Contains persistent cell records
 * 9 - Cell Temporary Children: Contains temporary cell records
 * 
 * @param buffer The plugin file buffer
 * @param offset The offset in the buffer where the GRUP starts
 * @param pluginName The name of the plugin being processed
 * @returns Array of parsed records found in this GRUP
 */
export function processGRUP(buffer: Buffer, offset: number, pluginName: string): ParsedRecord[] {
  try {
    const header = parseGRUPHeader(buffer, offset);
    validateGRUPSize(header, buffer, offset);

    // Log GRUP header info
    debugLog(`\nGRUP at offset ${offset}:`);
    debugLog(`  Type: ${header.groupType} (${getGroupTypeName(header.groupType)})`);
    debugLog(`  Size: ${header.size} bytes`);
    if (header.groupType === 0) {
      debugLog(`  Label: ${header.label.toString('ascii')}`);
    }
    debugLog(`  Timestamp: ${header.timestamp}`);
    debugLog(`  Version: ${header.versionControl}`);
    
    // Dump GRUP header and initial data
    dumpHex(buffer, offset, 24, 'GRUP Header Hex Dump (24 bytes)');
    dumpHex(buffer, offset + 24, 64, 'Initial GRUP Data (64 bytes)');

    // For Top-Level GRUPs (type 0), we know exactly what type of records to expect
    // because the label in the header tells us (e.g., RACE, PERK, etc.)
    if (header.groupType === 0) {
      const recordType = header.label.toString('ascii');
      if (!PROCESSED_RECORD_TYPES.has(recordType)) {
        debugLog(`  Skipping group with label ${recordType} because it's unsupported`);
        return []; // Skip this GRUP if we don't care about its type
      }
      debugLog(`  Processing records of type: ${recordType}`);
      return processTopLevelGRUP(buffer, offset, header, recordType, pluginName);
    }

    // For all other GRUP types, we need to check each record's type
    // because they can contain multiple types of records and nested GRUPs
    return processNestedGRUP(buffer, offset, header, pluginName);
  } catch (error: any) {
    errorLog('processGRUP', `Failed to process GRUP at offset ${offset}: ${error.message}`);
    throw error;
  }
}

/**
 * Processes a Top-Level GRUP (type 0) which contains records of a single known type.
 * These GRUPs are the main record groups in the plugin file and contain
 * all records of a specific type (e.g., all RACE records or all PERK records).
 * 
 * Example structure:
 * GRUP (type 0, label: RACE)
 * ├── RACE record
 * ├── RACE record
 * └── RACE record
 * 
 * @param buffer The plugin file buffer
 * @param offset The offset in the buffer where the GRUP starts
 * @param header The parsed GRUP header
 * @param recordType The type of records in this GRUP (e.g., 'RACE', 'PERK')
 * @param pluginName The name of the plugin being processed
 * @returns Array of parsed records found in this GRUP
 */
function processTopLevelGRUP(
  buffer: Buffer, 
  offset: number, 
  header: any, 
  recordType: string,
  pluginName: string
): ParsedRecord[] {
  try {
    const records: ParsedRecord[] = [];
    let currentOffset = offset + 24; // Skip GRUP header
    const endOffset = offset + header.size;

    while (currentOffset < endOffset) {
      debugLog(`\nProcessing record at offset ${currentOffset}:`);
      
      // Parse record header
      const recordHeader = parseRecordHeader(buffer.subarray(currentOffset, currentOffset + RECORD_HEADER_SIZE));
      const totalRecordSize = RECORD_HEADER_SIZE + recordHeader.dataSize;
      
      debugLog(`  Record type: ${recordHeader.type}`);
      debugLog(`  Data size: ${recordHeader.dataSize}`);
      debugLog(`  Total record size (header + data): ${totalRecordSize}`);
      
      // Dump record header and initial data
      dumpHex(buffer, currentOffset, RECORD_HEADER_SIZE, 'Record Header Hex Dump (24 bytes)');
      dumpHex(buffer, currentOffset + RECORD_HEADER_SIZE, 64, 'Initial Record Data (64 bytes)');

      // Process the record
      const { record } = parseRecord(buffer, currentOffset, pluginName);
      records.push(record);
      
      // Advance to next record using the correct size calculation
      currentOffset += totalRecordSize;
      debugLog(`  Advanced to next record at offset: ${currentOffset}`);
    }

    return records;
  } catch (error: any) {
    errorLog('processTopLevelGRUP', `Failed to process top-level GRUP at offset ${offset}: ${error.message}`);
    throw error;
  }
}

/**
 * Processes a nested GRUP which can contain multiple types of records and nested GRUPs.
 * These GRUPs are used for organizing records hierarchically, like worldspaces,
 * cells, and their children.
 * 
 * Example structure:
 * GRUP (type 1, World Children)
 * ├── GRUP (type 2, Cell Block)
 * │   ├── CELL record
 * │   └── CELL record
 * └── GRUP (type 2, Cell Block)
 *     ├── CELL record
 *     └── CELL record
 * 
 * @param buffer The plugin file buffer
 * @param offset The offset in the buffer where the GRUP starts
 * @param header The parsed GRUP header
 * @param pluginName The name of the plugin being processed
 * @returns Array of parsed records found in this GRUP and its nested GRUPs
 */
function processNestedGRUP(
  buffer: Buffer, 
  offset: number, 
  header: any,
  pluginName: string
): ParsedRecord[] {
  try {
    const records: ParsedRecord[] = [];
    let currentOffset = offset + 24;
    const endOffset = offset + header.size;

    debugLog(`\nProcessing nested GRUP from ${offset} to ${endOffset} (size: ${header.size})`);

    while (currentOffset < endOffset) {
      debugLog(`\nProcessing at offset ${currentOffset}:`);
      
      // Dump header
      dumpHex(buffer, currentOffset, RECORD_HEADER_SIZE, 'Header Hex Dump (24 bytes)');

      const recordType = buffer.toString('ascii', currentOffset, currentOffset + 4);
      debugLog(`  Record type: ${recordType}`);
      
      if (recordType === 'GRUP') {
        // Recursively process nested GRUP
        const nestedRecords = processGRUP(buffer, currentOffset, pluginName);
        records.push(...nestedRecords);
        const grupHeader = parseGRUPHeader(buffer, currentOffset);
        debugLog(`  Nested GRUP size: ${grupHeader.size}`);
        currentOffset += grupHeader.size;
      } else {
        // Read the record header to get its size
        const recordHeader = parseRecordHeader(buffer.subarray(currentOffset, currentOffset + RECORD_HEADER_SIZE));
        const totalRecordSize = RECORD_HEADER_SIZE + recordHeader.dataSize;
        
        debugLog(`  Record size: ${recordHeader.dataSize}`);
        debugLog(`  Total record size (header + data): ${totalRecordSize}`);
        
        // Dump initial record data
        dumpHex(buffer, currentOffset + RECORD_HEADER_SIZE, 64, 'Initial Record Data (64 bytes)');
        
        if (!PROCESSED_RECORD_TYPES.has(recordType)) {
          debugLog(`  Skipping record of type ${recordType} because it's unsupported`);
          currentOffset += totalRecordSize; // Skip header + data
          continue;
        }
        
        // Process supported records
        const { record } = parseRecord(buffer, currentOffset, pluginName);
        records.push(record);
        currentOffset += totalRecordSize;
      }

      debugLog(`  Next offset: ${currentOffset}`);
    }

    return records;
  } catch (error: any) {
    errorLog('processNestedGRUP', `Failed to process nested GRUP at offset ${offset}: ${error.message}`);
    throw error;
  }
} 