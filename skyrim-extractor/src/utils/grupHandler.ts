import { ParsedRecord } from '../types';
import { parseGRUPHeader, validateGRUPSize } from './recordUtils';
import { parseRecordHeader, scanSubrecords } from './bufferParser';

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

  // For Top-Level GRUPs, check if we care about this type
  if (header.groupType === 0) {
    const recordType = header.label.toString('ascii');
    if (!PROCESSED_RECORD_TYPES.has(recordType)) {
      console.log(`  Skipping - not a processed record type`);
      return []; // Skip this GRUP if we don't care about its type
    }
    console.log(`  Processing records of type: ${recordType}`);
    return processTopLevelGRUP(buffer, offset, header, recordType, pluginName);
  }

  // For other GRUP types, we need to check each record
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
    const recordHeader = parseRecordHeader(buffer.slice(currentOffset, currentOffset + 20));
    const recordData = buffer.slice(currentOffset + 20, currentOffset + 20 + recordHeader.dataSize);
    
    records.push({
      meta: {
        type: recordType,
        formId: recordHeader.formId,
        plugin: pluginName
      },
      data: parseSubrecords(recordData),
      header: buffer.slice(currentOffset, currentOffset + 20).toString('base64')
    });

    currentOffset += 20 + recordHeader.dataSize;
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

  while (currentOffset < endOffset) {
    const recordType = buffer.toString('ascii', currentOffset, currentOffset + 4);
    
    if (recordType === 'GRUP') {
      // Recursively process nested GRUP
      const nestedRecords = processGRUP(buffer, currentOffset, pluginName);
      records.push(...nestedRecords);
    } else if (PROCESSED_RECORD_TYPES.has(recordType)) {
      // Process normal record if it's a type we care about
      const recordHeader = parseRecordHeader(buffer.slice(currentOffset, currentOffset + 20));
      const recordData = buffer.slice(currentOffset + 20, currentOffset + 20 + recordHeader.dataSize);
      
      records.push({
        meta: {
          type: recordType,
          formId: recordHeader.formId,
          plugin: pluginName
        },
        data: parseSubrecords(recordData),
        header: buffer.slice(currentOffset, currentOffset + 20).toString('base64')
      });
    }
    // Skip records we don't care about

    // Move to next record
    if (recordType === 'GRUP') {
      const grupHeader = parseGRUPHeader(buffer, currentOffset);
      currentOffset += grupHeader.size;
    } else {
      const recordHeader = parseRecordHeader(buffer.slice(currentOffset, currentOffset + 20));
      currentOffset += 20 + recordHeader.dataSize;
    }
  }

  return records;
}

/**
 * Parse subrecords from a record's data buffer
 */
function parseSubrecords(dataBuffer: Buffer): Record<string, Buffer[]> {
  const subrecords: Record<string, Buffer[]> = {};
  
  for (const subrecord of scanSubrecords(dataBuffer)) {
    if (!subrecords[subrecord.type]) {
      subrecords[subrecord.type] = [];
    }
    subrecords[subrecord.type].push(subrecord.data);
  }
  
  return subrecords;
} 