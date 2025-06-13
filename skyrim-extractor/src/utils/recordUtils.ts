import { RecordHeader } from '../types';
import { parentPort } from 'worker_threads';

export type RecordCategory = 'TES4' | 'GRUP' | 'NORMAL' | 'UNKNOWN';

export interface GRUPHeader {
  signature: string;    // Always "GRUP"
  size: number;        // Size of entire group including header (24 bytes)
  label: Buffer;       // Raw label bytes - format depends on group type
  groupType: number;   // Group type (0-9)
  groupTypeStr: string;// Human readable group type
  timestamp: number;   // Timestamp (format depends on game version)
  versionControl: number; // Version control info
  unknown: number;     // Unknown value
}

function debugLog(message: string) {
  if (parentPort) {
    parentPort.postMessage({ type: 'debug', message });
  }
}

/**
 * Safely determines the type of record at the given offset
 * Note: For TES4 records, we need to check the first 4 bytes for 'TES4'
 * For all other records, we check bytes 4-8 for the type
 */
export function getRecordTypeAt(buffer: Buffer, offset: number): string {
  if (offset + 4 > buffer.length) {
    debugLog(`Buffer too short at offset ${offset} (need 4 bytes, have ${buffer.length - offset})`);
    return 'UNKNOWN';
  }

  const type = buffer.toString('ascii', offset, offset + 4);
  debugLog(`Reading record type at offset ${offset}: ${type} (${Buffer.from(type).toString('hex')})`);

  // Validate record type
  if (!/^[A-Z0-9]{4}$/.test(type)) {
    debugLog(`Invalid record type at offset ${offset}: ${type}`);
    return 'UNKNOWN';
  }

  return type;
}

/**
 * Validates that a record type is valid ASCII
 */
export function validateRecordType(buffer: Buffer, offset: number): void {
  const type = buffer.toString('ascii', offset + 4, offset + 8);
  if (!/^[A-Z0-9_ ]{4}$/.test(type)) {
    // Log the raw bytes for debugging
    const rawBytes = Array.from(buffer.slice(offset, offset + 8))
      .map(b => b.toString(16).padStart(2, '0'))
      .join(' ');
    
    throw new Error(
      `Invalid record type at offset ${offset}:\n` +
      `Type: '${type}'\n` +
      `Raw bytes: ${rawBytes}\n` +
      `Expected 4 ASCII characters [A-Z0-9_ ]`
    );
  }
}

/**
 * Parses a GRUP header at the given offset
 */
export function parseGRUPHeader(buffer: Buffer, offset: number): GRUPHeader {
  if (offset + 24 > buffer.length) {
    throw new Error(`Incomplete GRUP header at offset ${offset}`);
  }

  // First verify this is actually a GRUP record
  const signature = buffer.toString('ascii', offset, offset + 4);
  if (signature !== 'GRUP') {
    throw new Error(`Invalid GRUP signature at offset ${offset}: ${signature}`);
  }

  const size = buffer.readUInt32LE(offset + 4);      // Size of entire group including header
  const label = buffer.slice(offset + 8, offset + 12); // Raw label bytes
  const groupType = buffer.readUInt32LE(offset + 12);
  const timestamp = buffer.readUInt16LE(offset + 16);
  const versionControl = buffer.readUInt16LE(offset + 18);
  const unknown = buffer.readUInt32LE(offset + 20);

  // Convert group type to string
  const groupTypeStr = (() => {
    switch (groupType) {
      case 0: return 'Top (Type)';
      case 1: return 'World Children';
      case 2: return 'Interior Cell Block';
      case 3: return 'Interior Cell Sub-Block';
      case 4: return 'Exterior Cell Block';
      case 5: return 'Exterior Cell Sub-Block';
      case 6: return 'Cell Children';
      case 7: return 'Topic Children';
      case 8: return 'Cell Persistent Children';
      case 9: return 'Cell Temporary Children';
      default: return `Unknown (${groupType})`;
    }
  })();

  return {
    signature,
    size,
    label,
    groupType,
    groupTypeStr,
    timestamp,
    versionControl,
    unknown
  };
}

/**
 * Validates that a record's data size is reasonable
 */
export function validateRecordSize(header: RecordHeader, buffer: Buffer, offset: number): void {
  // First check if size exceeds remaining buffer
  if (header.dataSize > buffer.length - offset - 20) {
    throw new Error(
      `Record at offset ${offset} has invalid data size:\n` +
      `Data size: ${header.dataSize}\n` +
      `Remaining buffer: ${buffer.length - offset - 20}\n` +
      `Buffer size: ${buffer.length}\n` +
      `Offset: ${offset}`
    );
  }

  // Then check if total record size exceeds buffer
  if (offset + 20 + header.dataSize > buffer.length) {
    throw new Error(
      `Record at offset ${offset} exceeds buffer bounds.\n` +
      `Record type: ${header.type}\n` +
      `Data size: ${header.dataSize}\n` +
      `Buffer size: ${buffer.length}\n` +
      `Remaining bytes: ${buffer.length - offset}`
    );
  }
}

/**
 * Validates that a GRUP's size is reasonable
 */
export function validateGRUPSize(grup: GRUPHeader, buffer: Buffer, offset: number): void {
  // First check if size exceeds remaining buffer
  if (grup.size > buffer.length - offset) {
    throw new Error(
      `GRUP at offset ${offset} has invalid size:\n` +
      `Group size: ${grup.size}\n` +
      `Remaining buffer: ${buffer.length - offset}\n` +
      `Buffer size: ${buffer.length}\n` +
      `Offset: ${offset}`
    );
  }

  // Then check if total GRUP size exceeds buffer
  if (offset + grup.size > buffer.length) {
    throw new Error(
      `GRUP at offset ${offset} exceeds buffer bounds.\n` +
      `Group size: ${grup.size}\n` +
      `Buffer size: ${buffer.length}\n` +
      `Remaining bytes: ${buffer.length - offset}`
    );
  }
}

/**
 * Formats a buffer slice as hex and ASCII for debugging
 */
export function formatBufferSlice(buffer: Buffer, offset: number, length: number = 16): string {
  const slice = buffer.slice(offset, offset + length);
  const hex = Array.from(slice)
    .map(b => b.toString(16).padStart(2, '0'))
    .join(' ');
  const ascii = slice.toString('ascii').replace(/[^\x20-\x7E]/g, '.');
  return `Hex: ${hex}\nASCII: ${ascii}`;
}