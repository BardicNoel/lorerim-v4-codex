import { JsonArray, RemoveFieldsConfig } from '../../types/pipeline';
import { Processor } from './index';
import { getNestedValue, setNestedValue } from '../../utils/field-access';
import { ParsedRecord } from '@lorerim/platform-types';

function processNestedFields(obj: Record<string, any>, fields: any, path: string[] = []): void {
  console.log(`[DEBUG] Processing fields at path: ${path.join('.')}`);
  console.log(`[DEBUG] Object keys: ${Object.keys(obj).join(', ')}`);
  console.log(`[DEBUG] Fields to process: ${JSON.stringify(fields, null, 2)}`);

  for (const [key, value] of Object.entries(fields)) {
    const currentPath = [...path, key];
    console.log(`[DEBUG] Processing key: ${key} at path: ${currentPath.join('.')}`);

    if (value === 'all') {
      console.log(`[DEBUG] Removing entire field: ${key}`);
      delete obj[key];
    } else if (Array.isArray(value)) {
      console.log(`[DEBUG] Processing array of fields to remove: ${value.join(', ')}`);
      if (obj[key] && typeof obj[key] === 'object') {
        for (const field of value) {
          if (typeof field === 'string' && field in obj[key]) {
            console.log(`[DEBUG] Removing field ${field} from ${key}`);
            delete obj[key][field];
          } else if (typeof field === 'object') {
            // Handle nested field specifications
            for (const [nestedKey, nestedValue] of Object.entries(field)) {
              if (nestedKey in obj[key]) {
                if (Array.isArray(nestedValue)) {
                  console.log(
                    `[DEBUG] Processing nested array of fields: ${nestedValue.join(', ')}`
                  );
                  for (const nestedField of nestedValue) {
                    if (nestedField in obj[key][nestedKey]) {
                      console.log(
                        `[DEBUG] Removing nested field ${nestedField} from ${key}.${nestedKey}`
                      );
                      delete obj[key][nestedKey][nestedField];
                    }
                  }
                }
              }
            }
          }
        }
      } else {
        console.log(`[DEBUG] Key ${key} is not an object or doesn't exist`);
      }
    } else if (typeof value === 'object' && value !== null) {
      console.log(`[DEBUG] Processing nested object for key: ${key}`);
      if (obj[key]) {
        if (Array.isArray(obj[key])) {
          console.log(`[DEBUG] Processing array of objects for key: ${key}`);
          obj[key].forEach((item: any, index: number) => {
            if (typeof item === 'object' && item !== null) {
              console.log(`[DEBUG] Processing array item ${index} for key: ${key}`);
              processNestedFields(item, value, [...currentPath, index.toString()]);
            }
          });
        } else if (typeof obj[key] === 'object') {
          console.log(`[DEBUG] Processing nested object for key: ${key}`);
          processNestedFields(obj[key], value, currentPath);
        } else {
          console.log(`[DEBUG] Key ${key} is not an object or array`);
        }
      } else {
        console.log(`[DEBUG] Key ${key} does not exist in object`);
      }
    }
  }
}

export function createRemoveFieldsProcessor(config: RemoveFieldsConfig): Processor {
  let fieldsRemoved = 0;
  let totalRecords = 0;

  return {
    async transform(data: JsonArray): Promise<JsonArray> {
      totalRecords = data.length;
      console.log(`[DEBUG] Processing ${totalRecords} records`);
      console.log(`[DEBUG] Remove fields config: ${JSON.stringify(config.fields, null, 2)}`);

      return data.map((record, index) => {
        console.log(`[DEBUG] Processing record ${index}`);
        const parsedRecord = record as ParsedRecord;
        const newRecord: ParsedRecord = {
          ...parsedRecord,
        };

        processNestedFields(newRecord, config.fields);
        return newRecord;
      });
    },

    getStats: () => ({
      recordsProcessed: totalRecords,
      fieldsRemoved,
    }),
  };
}
