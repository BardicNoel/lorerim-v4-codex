import { JsonArray, JsonRecord, KeepFieldsConfig, ProcessingResult } from '../../types/pipeline';
import { Processor } from './index';

function evaluateCondition(record: JsonRecord, condition: { field: string; operator: string; value: any }): boolean {
  const fieldValue = record[condition.field] ?? null;
  
  switch (condition.operator) {
    case 'equals':
      return fieldValue === condition.value;
    case 'not-equals':
      return fieldValue !== condition.value;
    case 'contains':
      return fieldValue !== null && String(fieldValue).includes(String(condition.value));
    case 'not-contains':
      return fieldValue !== null && !String(fieldValue).includes(String(condition.value));
    case 'greater-than':
      return fieldValue !== null && fieldValue > condition.value;
    case 'less-than':
      return fieldValue !== null && fieldValue < condition.value;
    default:
      throw new Error(`Unknown operator: ${condition.operator}`);
  }
}

export function createKeepFieldsProcessor(config: KeepFieldsConfig): Processor {
  let stats: ProcessingResult = {
    recordsProcessed: 0,
    fieldsKept: 0
  };

  return {
    transform: async (data: JsonArray): Promise<JsonArray> => {
      stats.recordsProcessed = data.length;
      stats.fieldsKept = 0;

      return data.map(record => {
        // Check if conditions are met
        const shouldProcess = !config.conditions || 
          config.conditions.every(condition => evaluateCondition(record, condition));

        if (!shouldProcess) {
          return record;
        }

        // Create new record with only specified fields
        const newRecord: JsonRecord = {};
        config.fields.forEach(field => {
          if (field in record) {
            newRecord[field] = record[field];
            stats.fieldsKept!++;
          }
        });

        return newRecord;
      });
    },

    getStats: () => stats
  };
} 