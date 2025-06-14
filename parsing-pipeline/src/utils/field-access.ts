import { JsonValue } from '../types/pipeline';
import { ParsedRecord } from '@lorerim/platform-types';

/**
 * Get a value from a nested object using dot notation
 * @param record The record to get the value from
 * @param path The dot-notation path to the field (e.g., "data.EDID")
 * @returns The value at the specified path, or undefined if not found
 */
export function getNestedValue(record: ParsedRecord, path: string): JsonValue | undefined {
    const parts = path.split('.');
    let current: any = record;

    // Special handling for data fields
    if (parts[0] === 'data') {
        current = record.data;
        parts.shift(); // Remove 'data' from path
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
 * @param path The dot-notation path to the field (e.g., "data.EDID")
 * @param value The value to set
 */
export function setNestedValue(record: ParsedRecord, path: string, value: JsonValue): void {
    const parts = path.split('.');
    let current: any = record;

    // Special handling for data fields
    if (parts[0] === 'data') {
        current = record.data;
        parts.shift(); // Remove 'data' from path
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