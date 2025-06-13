import { parentPort } from 'worker_threads';
import { hexDump } from '../bufferParser';

// Types we care about according to design doc
export const PROCESSED_RECORD_TYPES = new Set([
  'PERK',  // Perks
  'AVIF',  // Actor Value Information
  'RACE',  // Races
  'SPEL',  // Spells
  'MGEF'   // Magic Effects
]);

// Constants for record structure
export const RECORD_HEADER_SIZE = 24; // Signature(4) + DataSize(4) + Flags(4) + FormID(4) + VersionControlInfo(4) + Unknown(4)
export const SUBRECORD_HEADER_SIZE = 6; // Signature(4) + Size(2)

/**
 * Utility function to format debug messages with [grupHandler] prefix
 */
export function debugLog(message: string) {
  parentPort?.postMessage({ type: 'debug', message: `[grupHandler] ${message}` });
}

/**
 * Utility function to format error messages with [grupHandler] prefix and function name
 */
export function errorLog(functionName: string, message: string) {
  parentPort?.postMessage({ 
    type: 'error', 
    error: `[grupHandler:${functionName}] ${message}` 
  });
}

/**
 * Utility function to dump hex data with proper formatting and indentation
 */
export function dumpHex(buffer: Buffer, offset: number, size: number, title: string, indent: string = '  ') {
  debugLog(`${indent}${title}:`);
  hexDump(buffer.subarray(offset, offset + size), 0, size).forEach(line => 
    debugLog(`${indent}  ${line}`)
  );
}

/**
 * Get human-readable name for GRUP type
 */
export function getGroupTypeName(type: number): string {
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