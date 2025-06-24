import { JsonArray, KeepFieldsConfig, ProcessingResult } from '../../types/pipeline';
import { Processor } from './index';
import { getNestedValue } from '../../utils/field-access';

function evaluateCondition(
  record: any,
  condition: { field: string; operator: string; value: any }
): boolean {
  const fieldValue = getNestedValue(record, condition.field);

  switch (condition.operator) {
    case 'equals':
      return fieldValue === condition.value;
    case 'not-equals':
      return fieldValue !== condition.value;
    case 'contains':
      return typeof fieldValue === 'string' && fieldValue.includes(String(condition.value));
    case 'not-contains':
      return typeof fieldValue === 'string' && !fieldValue.includes(String(condition.value));
    case 'greater-than':
      return typeof fieldValue === 'number' && fieldValue > condition.value;
    case 'less-than':
      return typeof fieldValue === 'number' && fieldValue < condition.value;
    default:
      throw new Error(`Unknown operator: ${condition.operator}`);
  }
}

/**
 * Safely set a nested value in an object
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

export function createKeepFieldsProcessor(config: KeepFieldsConfig): Processor {
  let stats: ProcessingResult = {
    recordsProcessed: 0,
    fieldsKept: 0,
  };

  return {
    transform: async (data: JsonArray): Promise<JsonArray> => {
      stats.recordsProcessed = data.length;
      stats.fieldsKept = 0;

      return data.map((record) => {
        const shouldProcess =
          !config.conditions ||
          config.conditions.every((condition) => evaluateCondition(record, condition));

        if (!shouldProcess) {
          return record; // Keep the record unchanged if conditions aren't met
        }

        // Create a new object with only the specified fields
        const newRecord: any = {};

        for (const fieldPath of config.fields) {
          const fieldValue = getNestedValue(record, fieldPath);
          if (fieldValue !== undefined) {
            // If it's a simple field (no dots), just copy it directly
            if (!fieldPath.includes('.')) {
              newRecord[fieldPath] = fieldValue;
            } else {
              // For nested fields, preserve the structure
              setNestedValue(newRecord, fieldPath, fieldValue);
            }
            stats.fieldsKept!++;
          }
        }

        return newRecord;
      });
    },

    getStats: () => stats,
  };
}
