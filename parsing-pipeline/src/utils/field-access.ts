import { JsonValue } from '../types/pipeline';
import { ParsedRecord } from '@lorerim/platform-types';

/**
 * Get a value from a nested object using dot notation
 * @param record The record to get the value from
 * @param path The dot-notation path to the field (e.g., "record.EDID")
 * @returns The value at the specified path, or undefined if not found
 */
export function getNestedValue(record: ParsedRecord, path: string): JsonValue | undefined {
  const parts = path.split('.');
  let current: any = record;

  // Special handling for record fields (subrecords)
  if (parts[0] === 'record') {
    if (!Array.isArray(record.record)) return undefined;
    const tag = parts[1];
    const sub = record.record.find((r) => r.tag === tag);
    if (!sub) return undefined;
    if (parts.length === 2) return sub.buffer;
    // If further nesting, treat sub as an object (not typical for subrecords, but for future-proofing)
    current = sub;
    parts.shift(); // Remove 'record'
    parts.shift(); // Remove tag
  } else if (parts[0] === 'meta') {
    current = record.meta;
    parts.shift(); // Remove 'meta' from path
  }

  for (const part of parts) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return undefined;
    }
    current = current[part];
  }

  return current;
}

/**
 * Set a value in a nested object using dot notation
 * @param record The record to set the value in
 * @param path The dot-notation path to the field (e.g., "record.EDID")
 * @param value The value to set
 */
export function setNestedValue(record: ParsedRecord, path: string, value: JsonValue): void {
  const parts = path.split('.');
  let current: any = record;

  // Special handling for record fields (subrecords)
  if (parts[0] === 'record') {
    if (!Array.isArray(record.record)) return;
    const tag = parts[1];
    const subIdx = record.record.findIndex((r) => r.tag === tag);
    if (subIdx === -1) return;
    if (parts.length === 2) {
      record.record[subIdx].buffer = value as string;
      return;
    }
    current = record.record[subIdx];
    parts.shift(); // Remove 'record'
    parts.shift(); // Remove tag
  } else if (parts[0] === 'meta') {
    current = record.meta;
    parts.shift(); // Remove 'meta' from path
  }

  // Navigate to the second-to-last part
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (!(part in current)) {
      current[part] = {};
    }
    current = current[part];
  }

  // Set the value at the last part
  current[parts[parts.length - 1]] = value;
}

/**
 * Check if a path exists in an object
 * @param record The record to check
 * @param path The dot-notation path to check
 * @returns True if the path exists, false otherwise
 */
export function hasNestedPath(record: ParsedRecord, path: string): boolean {
  return getNestedValue(record, path) !== undefined;
}
