import { JsonArray, ProcessingResult } from '../../types/pipeline';
import { Processor } from './index';

export interface PluckArrayValuesConfig {
  name: string;
  type: 'pluck-array-values';
  arrayField: string; // e.g., 'religionData.values'
  targetField: string; // e.g., 'formId_resolved'
}

export function createPluckArrayValuesProcessor(config: PluckArrayValuesConfig): Processor {
  let stats: ProcessingResult = {
    recordsProcessed: 0,
    valuesPlucked: 0,
  };

  return {
    transform: async (data: JsonArray): Promise<JsonArray> => {
      stats.recordsProcessed = data.length;
      stats.valuesPlucked = 0;

      return data.map((record) => {
        const newRecord = { ...record };
        
        // Navigate to the array field
        const arrayPath = config.arrayField.split('.');
        let current = newRecord;
        
        for (const pathPart of arrayPath) {
          if (current && typeof current === 'object' && pathPart in current) {
            current = current[pathPart];
          } else {
            return newRecord; // Path not found, return record as-is
          }
        }

        // Check if we found an array
        if (!Array.isArray(current)) {
          return newRecord;
        }

        // Process each element in the array
        for (let i = 0; i < current.length; i++) {
          const element = current[i];
          if (element && typeof element === 'object' && config.targetField in element) {
            // Replace the object with just the field value
            current[i] = element[config.targetField];
            stats.valuesPlucked!++;
          }
          // If element doesn't have the target field, leave it unchanged
        }

        return newRecord;
      });
    },
    getStats: () => stats,
  };
} 