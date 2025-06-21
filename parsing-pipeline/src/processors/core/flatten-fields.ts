import { JsonArray, ProcessingResult } from '../../types/pipeline';
import { Processor } from './index';
import { ParsedRecord } from '@lorerim/platform-types';

export interface FlattenFieldsConfig {
  name: string;
  type: 'flatten-fields';
  fields: string[]; // e.g., ['decodedData', 'perkSections[].PNAM']
}

export function createFlattenFieldsProcessor(config: FlattenFieldsConfig): Processor {
  let stats: ProcessingResult = {
    recordsProcessed: 0,
    fieldsFlattened: 0,
  };

  return {
    transform: async (data: JsonArray): Promise<JsonArray> => {
      stats.recordsProcessed = data.length;
      stats.fieldsFlattened = 0;

      return data.map((record) => {
        let newRecord: any = { ...record };

        for (const field of config.fields) {
          // Handle array syntax: e.g., 'perkSections[].PNAM'
          const arrayMatch = field.match(/^(.+)\[\]\.([^.]+)$/);
          if (arrayMatch) {
            const arrayPath = arrayMatch[1];
            const subField = arrayMatch[2];
            const array = newRecord[arrayPath];
            if (Array.isArray(array)) {
              array.forEach((element: any, idx: number) => {
                if (
                  element &&
                  typeof element === 'object' &&
                  subField in element &&
                  typeof element[subField] === 'object' &&
                  element[subField] !== null
                ) {
                  Object.assign(element, element[subField]);
                  delete element[subField];
                  stats.fieldsFlattened!++;
                }
              });
            }
          } else {
            // Default: flatten at root
            if (
              field in newRecord &&
              typeof newRecord[field] === 'object' &&
              newRecord[field] !== null
            ) {
              const toFlatten = newRecord[field];
              for (const [key, value] of Object.entries(toFlatten)) {
                if (!(key in newRecord)) {
                  newRecord[key] = value;
                  stats.fieldsFlattened!++;
                }
              }
              delete newRecord[field];
            }
          }
        }
        return newRecord;
      });
    },
    getStats: () => stats,
  };
}
