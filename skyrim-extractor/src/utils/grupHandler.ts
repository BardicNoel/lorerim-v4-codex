import { ParsedRecord } from '../types';
import { parseGRUPHeader, validateGRUPSize } from './recordUtils';
import { parseRecord, parseRecordHeader } from '../recordParser';
import { hexDump } from './bufferParser';

// Types we care about according to design doc
const PROCESSED_RECORD_TYPES = new Set([
  'PERK',  // Perks
  'AVIF',  // Actor Value Information
  'RACE',  // Races
  'SPEL',  // Spells
  'MGEF'   // Magic Effects
]);

/**
 * Process a GRUP record and extract its children if it's a type we care about
 */
export function processGRUP(buffer: Buffer, offset: number, pluginName: string): ParsedRecord[] {
  const header = parseGRUPHeader(buffer, offset);
  validateGRUPSize(header, buffer, offset);

  // Log GRUP header info
  console.log(`\nGRUP at offset ${offset}:`);
  console.log(`  Type: ${header.groupType} (${getGroupTypeName(header.groupType)})`);
  console.log(`  Size: ${header.size} bytes`);
  if (header.groupType === 0) {
    console.log(`  Label: ${header.label.toString('ascii')}`);
  }
  console.log(`  Timestamp: ${header.timestamp}`);
  console.log(`  Version: ${header.versionControl}`);
  console.log('  Buffer context:');
  console.log(hexDump(buffer, offset, 32).join('\n'));

  // For Top-Level GRUPs, check if we care about this type
  if (header.groupType === 0) {
    const recordType = header.label.toString('ascii');
    if (!PROCESSED_RECORD_TYPES.has(recordType)) {
      console.log(`  Skipping group with label ${recordType} because it's unsupported`);
      return []; // Skip this GRUP if we don't care about its type
    }
    console.log(`  Processing records of type: ${recordType}`);
    return processTopLevelGRUP(buffer, offset, header, recordType, pluginName);
  }

  // For other GRUP types, process all records within them
  return processNestedGRUP(buffer, offset, header, pluginName);
}

/**
 * Get human-readable name for GRUP type
 */
function getGroupTypeName(type: number): string {
  const types = [
    'Top-Level',
    'World Children',
    'Interior Cell Block',
    'Interior Cell Sub-Block',
    'Exterior Cell Block',
    'Exterior Cell Sub-Block',
    'Cell Children',
    'Topic Children',
    'Cell Persistent Children',
    'Cell Temporary Children'
  ];
  return types[type] || 'Unknown';
}

/**
 * Process a Top-Level GRUP (type 0) which contains records of a known type
 */
function processTopLevelGRUP(
  buffer: Buffer, 
  offset: number, 
  header: any, 
  recordType: string,
  pluginName: string
): ParsedRecord[] {
  const records: ParsedRecord[] = [];
  let currentOffset = offset + 24; // Skip GRUP header
  const endOffset = offset + header.size;

  while (currentOffset < endOffset) {
    console.log(`\nProcessing record at offset ${currentOffset}:`);
    console.log('Buffer context:');
    console.log(hexDump(buffer, currentOffset, 32).join('\n'));

    const { record, newOffset } = parseRecord(buffer, currentOffset, pluginName);
    records.push(record);
    currentOffset = newOffset;
  }

  return records;
}

/**
 * Process a nested GRUP, checking each record's type
 */
function processNestedGRUP(
  buffer: Buffer, 
  offset: number, 
  header: any,
  pluginName: string
): ParsedRecord[] {
  const records: ParsedRecord[] = [];
  let currentOffset = offset + 24;
  const endOffset = offset + header.size;

  console.log(`\nProcessing nested GRUP from ${offset} to ${endOffset} (size: ${header.size})`);

  while (currentOffset < endOffset) {
    console.log(`\nProcessing at offset ${currentOffset}:`);
    console.log('Buffer context:');
    console.log(hexDump(buffer, currentOffset, 32).join('\n'));

    const recordType = buffer.toString('ascii', currentOffset, currentOffset + 4);
    console.log(`  Record type: ${recordType}`);
    
    if (recordType === 'GRUP') {
      // Recursively process nested GRUP
      const nestedRecords = processGRUP(buffer, currentOffset, pluginName);
      records.push(...nestedRecords);
      const grupHeader = parseGRUPHeader(buffer, currentOffset);
      console.log(`  Nested GRUP size: ${grupHeader.size}`);
      currentOffset += grupHeader.size;
    } else {
      // Read the record header to get its size
      const recordHeader = parseRecordHeader(buffer.slice(currentOffset, currentOffset + 20));
      console.log(`  Record size: ${recordHeader.dataSize}`);
      console.log(`  Total record size (header + data): ${20 + recordHeader.dataSize}`);
      
      if (!PROCESSED_RECORD_TYPES.has(recordType)) {
        console.log(`  Skipping record of type ${recordType} because it's unsupported`);
        currentOffset += 20 + recordHeader.dataSize; // Skip header + data
        continue;
      }
      
      // Process supported records
      const { record, newOffset } = parseRecord(buffer, currentOffset, pluginName);
      records.push(record);
      currentOffset = newOffset;
    }

    console.log(`  Next offset: ${currentOffset}`);
  }

  return records;
} 