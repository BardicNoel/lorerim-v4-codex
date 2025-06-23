import { JsonArray, ProcessingResult } from '../../types/pipeline';
import { Processor } from './index';

export interface ExtractFieldConfig {
  name: string;
  type: 'extract-field';
  field: string; // e.g., 'decodedData.VMAD.scripts[0].properties'
  description?: string;
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

export function createExtractFieldProcessor(config: ExtractFieldConfig): Processor {
  let stats: ProcessingResult = {
    recordsProcessed: 0,
    fieldsExtracted: 0,
  };

  return {
    transform: async (data: JsonArray): Promise<JsonArray> => {
      stats.recordsProcessed = data.length;
      stats.fieldsExtracted = 0;

      const extractedData: JsonArray = [];

      for (const record of data) {
        const extractedValue = getNestedValue(record, config.field);

        if (extractedValue !== undefined) {
          if (Array.isArray(extractedValue)) {
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
    },
    getStats: () => stats,
  };
}
