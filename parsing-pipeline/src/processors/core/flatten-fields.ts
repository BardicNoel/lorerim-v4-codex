import { JsonArray, ProcessingResult } from '../../types/pipeline';
import { Processor } from './index';
import { ParsedRecord } from '@lorerim/platform-types';

export interface FlattenFieldsConfig {
  name: string;
  type: 'flatten-fields';
  fields: string[]; // e.g., ['decodedData']
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
        const parsedRecord = record as ParsedRecord;
        let newRecord: any = { ...parsedRecord };
        // Flatten each specified field if present
        for (const field of config.fields) {
          if (
            field in parsedRecord &&
            typeof (parsedRecord as any)[field] === 'object' &&
            (parsedRecord as any)[field] !== null
          ) {
            const toFlatten = (parsedRecord as any)[field];
            for (const [key, value] of Object.entries(toFlatten)) {
              // Only add if not already present at the top level
              if (!(key in newRecord)) {
                (newRecord as any)[key] = value;
                stats.fieldsFlattened!++;
              }
            }
            // Remove the original field after flattening
            delete newRecord[field];
          }
        }
        return newRecord;
      });
    },
    getStats: () => stats,
  };
}
