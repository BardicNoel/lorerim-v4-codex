import { JsonArray, KeepFieldsConfig, ProcessingResult } from '../../types/pipeline';
import { Processor } from './index';
import { ParsedRecord } from '@lorerim/platform-types';
import { getNestedValue } from '../../utils/field-access';

function evaluateCondition(record: ParsedRecord, condition: { field: string; operator: string; value: any }): boolean {
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
        const parsedRecord = record as ParsedRecord;
        // Check if conditions are met
        const shouldProcess = !config.conditions || 
          config.conditions.every(condition => evaluateCondition(parsedRecord, condition));

        // Create new record with only specified fields
        const newRecord: ParsedRecord = {
          meta: { ...parsedRecord.meta },
          data: {},
          header: parsedRecord.header
        };

        if (shouldProcess) {
          // Process each field path
          config.fields.forEach(fieldPath => {
            const parts = fieldPath.split('.');
            if (parts[0] === 'data') {
              // Handle data fields
              const fieldName = parts[1];
              if (fieldName in parsedRecord.data) {
                newRecord.data[fieldName] = parsedRecord.data[fieldName];
                stats.fieldsKept!++;
              }
            } else if (parts[0] === 'meta') {
              // Handle meta fields
              const fieldName = parts[1];
              switch (fieldName) {
                case 'type':
                  newRecord.meta.type = parsedRecord.meta.type;
                  stats.fieldsKept!++;
                  break;
                case 'formId':
                  newRecord.meta.formId = parsedRecord.meta.formId;
                  stats.fieldsKept!++;
                  break;
                case 'plugin':
                  newRecord.meta.plugin = parsedRecord.meta.plugin;
                  stats.fieldsKept!++;
                  break;
                case 'stackOrder':
                  newRecord.meta.stackOrder = parsedRecord.meta.stackOrder;
                  stats.fieldsKept!++;
                  break;
              }
            }
          });
        } else {
          // If conditions aren't met, keep all fields
          newRecord.data = { ...parsedRecord.data };
        }

        return newRecord;
      });
    },

    getStats: () => stats
  };
} 