/**
 * Remove Fields Processor v2 - Simplified
 *
 * Removes specified fields from JSON records based on simple field paths.
 * Supports array notation like "CTDA[].operator" to remove fields from all array elements.
 *
 * Configuration format:
 * remove_fields:
 *   - "fieldName"                    # Remove direct field
 *   - "nested.field"                 # Remove nested field
 *   - "array[].field"               # Remove field from all array elements
 *   - "nested.array[].field"        # Remove field from nested array elements
 */

export interface RemoveFieldsConfig {
  remove_fields: string[];
  condition?: {
    field: string;
    value: any;
  };
}

export interface RemoveFieldsProcessor {
  process<T = any>(data: T[], config: RemoveFieldsConfig): T[];
}

/**
 * Utility function to safely get nested object property
 */
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => {
    return current && typeof current === 'object' ? current[key] : undefined;
  }, obj);
}

/**
 * Utility function to safely set nested object property
 */
function setNestedValue(obj: any, path: string, value: any): void {
  const keys = path.split('.');
  const lastKey = keys.pop()!;
  const target = keys.reduce((current, key) => {
    if (!(key in current) || typeof current[key] !== 'object') {
      current[key] = {};
    }
    return current[key];
  }, obj);
  target[lastKey] = value;
}

/**
 * Utility function to safely delete nested object property
 */
function deleteNestedValue(obj: any, path: string): boolean {
  const keys = path.split('.');
  const lastKey = keys.pop()!;
  const target = keys.reduce((current, key) => {
    return current && typeof current === 'object' ? current[key] : undefined;
  }, obj);

  if (target && typeof target === 'object' && lastKey in target) {
    delete target[lastKey];
    return true;
  }
  return false;
}

/**
 * Process a single field path (e.g., "CTDA[].operator" or "sections[].items[].extra")
 */
function processFieldPath(obj: any, fieldPath: string): void {
  // Handle array notation like "CTDA[].operator" or "sections[].items[].extra"
  if (fieldPath.includes('[]')) {
    // Split the path into segments, preserving the array notation
    const segments = fieldPath.split('[]');
    let lastSegment = segments.pop() || '';
    // Remove leading dot from last segment if present
    if (lastSegment.startsWith('.')) {
      lastSegment = lastSegment.substring(1);
    }
    // Build the path to the first array
    const firstArrayPath = segments[0];
    const array = getNestedValue(obj, firstArrayPath);
    if (Array.isArray(array)) {
      if (segments.length === 1 && !lastSegment) {
        // Simple case: "items[]" - remove entire array elements
        array.forEach((item, index) => {
          if (typeof item === 'object' && item !== null) {
            array[index] = null;
          }
        });
        // Clean up null entries
        const nullIndices = [];
        for (let i = array.length - 1; i >= 0; i--) {
          if (array[i] === null) {
            nullIndices.push(i);
          }
        }
        nullIndices.forEach((index) => array.splice(index, 1));
      } else if (segments.length === 1 && lastSegment) {
        // Single level: "items[].extra"
        array.forEach((item, index) => {
          if (typeof item === 'object' && item !== null) {
            deleteNestedValue(item, lastSegment);
          }
        });
      } else {
        // Multiple levels: "sections[].items[].extra"
        // Reconstruct the remaining path for recursion
        const remainingSegments = segments.slice(1);
        // Clean up leading dots from remaining segments
        const cleanSegments = remainingSegments.map((segment) =>
          segment.startsWith('.') ? segment.substring(1) : segment
        );
        const nextFieldPath =
          cleanSegments.join('[]') + '[]' + (lastSegment ? '.' + lastSegment : '');
        array.forEach((item, index) => {
          if (typeof item === 'object' && item !== null) {
            processFieldPath(item, nextFieldPath);
          }
        });
      }
    }
  } else {
    // Simple field removal
    deleteNestedValue(obj, fieldPath);
  }
}

/**
 * Check if a record matches the condition
 */
function matchesCondition(record: any, condition?: RemoveFieldsConfig['condition']): boolean {
  if (!condition) return true;

  const value = getNestedValue(record, condition.field);
  return value === condition.value;
}

/**
 * Remove Fields Processor v2 - Simplified Implementation
 */
export class RemoveFieldsProcessorV2 implements RemoveFieldsProcessor {
  process<T = any>(data: T[], config: RemoveFieldsConfig): T[] {
    if (!Array.isArray(data)) {
      throw new Error('Input data must be an array');
    }

    return data.map((record, index) => {
      // Check condition first
      if (!matchesCondition(record, config.condition)) {
        return record;
      }

      // Create a deep copy to avoid mutating original
      const processedRecord = JSON.parse(JSON.stringify(record));

      // Process each field path
      config.remove_fields.forEach((fieldPath) => {
        processFieldPath(processedRecord, fieldPath);
      });

      return processedRecord;
    });
  }
}

// Export the processor instance
export const removeFieldsProcessorV2 = new RemoveFieldsProcessorV2();
