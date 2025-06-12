import { JsonValue } from '../types/pipeline';

/**
 * Get a value from a nested object using dot notation
 * @param obj The object to get the value from
 * @param path The dot-notation path to the field (e.g., "user.profile.status")
 * @returns The value at the specified path, or undefined if not found
 */
export function getNestedValue(obj: Record<string, any>, path: string): JsonValue | undefined {
    const parts = path.split('.');
    let current: any = obj;

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
 * @param obj The object to set the value in
 * @param path The dot-notation path to the field (e.g., "user.profile.status")
 * @param value The value to set
 */
export function setNestedValue(obj: Record<string, any>, path: string, value: JsonValue): void {
    const parts = path.split('.');
    let current: any = obj;

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
 * @param obj The object to check
 * @param path The dot-notation path to check
 * @returns True if the path exists, false otherwise
 */
export function hasNestedPath(obj: Record<string, any>, path: string): boolean {
    return getNestedValue(obj, path) !== undefined;
} 