import { JsonArray, KeepFieldsConfig, ProcessingResult } from '../../types/pipeline';
import { Processor } from './index';
import { ParsedRecord } from '@lorerim/platform-types';
import { getNestedValue } from '../../utils/field-access';

function evaluateCondition(
  record: ParsedRecord,
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
        const parsedRecord = record as ParsedRecord;
        const shouldProcess =
          !config.conditions ||
          config.conditions.every((condition) => evaluateCondition(parsedRecord, condition));

        // Prepare new meta
        const newMeta = { ...parsedRecord.meta };
        // Prepare new record array
        let newRecordArr: { tag: string; buffer: string }[] = [];

        if (shouldProcess) {
          // Only keep specified fields
          for (const fieldPath of config.fields) {
            const parts = fieldPath.split('.');
            if (parts[0] === 'record') {
              const tag = parts[1];
              const found = parsedRecord.record.find((r) => r.tag === tag);
              if (found) {
                newRecordArr.push({ tag: found.tag, buffer: found.buffer });
                stats.fieldsKept!++;
              }
            } else if (parts[0] === 'meta') {
              const fieldName = parts[1];
              // Only assign known meta fields
              if (
                fieldName === 'type' ||
                fieldName === 'formId' ||
                fieldName === 'plugin' ||
                fieldName === 'stackOrder' ||
                fieldName === 'isWinner'
              ) {
                (newMeta as any)[fieldName] =
                  parsedRecord.meta[fieldName as keyof typeof parsedRecord.meta];
                stats.fieldsKept!++;
              }
              // Skip unknown meta fields
            }
          }
        } else {
          // If conditions aren't met, keep all subrecords
          newRecordArr = [...parsedRecord.record];
        }

        return {
          meta: newMeta,
          record: newRecordArr,
          header: parsedRecord.header,
        };
      });
    },

    getStats: () => stats,
  };
}
