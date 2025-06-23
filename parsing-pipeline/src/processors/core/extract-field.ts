import { JsonArray, ProcessingResult } from '../../types/pipeline';
import { Processor } from './index';

export interface ExtractFieldConfig {
  name: string;
  type: 'extract-field';
  field: string; // e.g., 'decodedData.VMAD.scripts[0].properties'
  description?: string;
  // New configuration options
  outputMode?: 'root' | 'sibling' | 'custom'; // Default: 'root'
  outputPath?: string; // For 'custom' mode, specify where to place extracted data
  preserveSource?: boolean; // Whether to keep the original field in the source record
  flattenArrays?: boolean; // Whether to flatten arrays into individual records (default: true)
}

/**
 * Utility function to safely get nested object property
 */
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => {
    // Handle array notation like "scripts[0]"
    const arrayMatch = key.match(/^(.+)\[(\d+)\]$/);
    if (arrayMatch) {
      const arrayKey = arrayMatch[1];
      const index = parseInt(arrayMatch[2]);
      return current && typeof current === 'object' && Array.isArray(current[arrayKey])
        ? current[arrayKey][index]
        : undefined;
    }
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
    if (!(key in current)) {
      current[key] = {};
    }
    return current[key];
  }, obj);

  target[lastKey] = value;
}

/**
 * Utility function to remove nested object property
 */
function removeNestedValue(obj: any, path: string): void {
  const keys = path.split('.');
  const lastKey = keys.pop()!;

  const target = keys.reduce((current, key) => {
    return current && typeof current === 'object' ? current[key] : undefined;
  }, obj);

  if (target && typeof target === 'object') {
    delete target[lastKey];
  }
}

export function createExtractFieldProcessor(config: ExtractFieldConfig): Processor {
  let stats: ProcessingResult = {
    recordsProcessed: 0,
    fieldsExtracted: 0,
  };

  return {
    transform: async (data: JsonArray): Promise<JsonArray> => {
      stats.recordsProcessed = data.length;
      stats.fieldsExtracted = 0;

      const outputMode = config.outputMode || 'root';
      const preserveSource = config.preserveSource ?? false;
      const flattenArrays = config.flattenArrays ?? true;

      if (outputMode === 'root') {
        // Original behavior - extract to root level
        const extractedData: JsonArray = [];

        for (const record of data) {
          const extractedValue = getNestedValue(record, config.field);

          if (extractedValue !== undefined) {
            if (Array.isArray(extractedValue) && flattenArrays) {
              // If the extracted value is an array, flatten it into the result
              extractedValue.forEach((item) => {
                extractedData.push(item);
                stats.fieldsExtracted!++;
              });
            } else {
              // If it's a single value, add it as a record
              extractedData.push(extractedValue);
              stats.fieldsExtracted!++;
            }
          }
        }

        return extractedData;
      } else {
        // Modify records in place
        const processedData: JsonArray = [];

        for (const record of data) {
          const extractedValue = getNestedValue(record, config.field);

          if (extractedValue !== undefined) {
            if (Array.isArray(extractedValue) && flattenArrays) {
              // Flatten arrays into individual records
              extractedValue.forEach((item) => {
                const processedRecord = { ...record };

                if (outputMode === 'sibling') {
                  // Extract to sibling level of the source field
                  const fieldParts = config.field.split('.');
                  const fieldName = fieldParts[fieldParts.length - 1];
                  processedRecord[fieldName] = item;
                } else if (outputMode === 'custom' && config.outputPath) {
                  // Place at custom path
                  setNestedValue(processedRecord, config.outputPath, item);
                }

                // Remove source field if not preserving
                if (!preserveSource) {
                  removeNestedValue(processedRecord, config.field);
                }

                processedData.push(processedRecord);
                stats.fieldsExtracted!++;
              });
            } else {
              // Single value or array without flattening
              const processedRecord = { ...record };

              if (outputMode === 'sibling') {
                // Extract to sibling level of the source field
                const fieldParts = config.field.split('.');
                const fieldName = fieldParts[fieldParts.length - 1];
                processedRecord[fieldName] = extractedValue;
              } else if (outputMode === 'custom' && config.outputPath) {
                // Place at custom path
                setNestedValue(processedRecord, config.outputPath, extractedValue);
              }

              // Remove source field if not preserving
              if (!preserveSource) {
                removeNestedValue(processedRecord, config.field);
              }

              processedData.push(processedRecord);
              stats.fieldsExtracted!++;
            }
          } else {
            // Keep record as-is if no extracted value
            processedData.push(record);
          }
        }

        return processedData;
      }
    },
    getStats: () => stats,
  };
}
