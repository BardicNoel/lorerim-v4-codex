import { JsonArray, SanitizeFieldsConfig } from '../../types/pipeline';
import { Processor } from './index';
import { ParsedRecord } from '@lorerim/platform-types';

function isExcludedField(fieldPath: string, excludeFields?: string[]): boolean {
  if (!excludeFields) return false;
  return excludeFields.some((excluded) => fieldPath.startsWith(excluded));
}

function extractFormId(value: string): string | null {
  const match = value.match(/\[([A-Z]+:[0-9A-F]+)\]/);
  return match ? match[1] : null;
}

function processRecordSubrecords(
  recordArr: { tag: string; buffer: string }[],
  rules: SanitizeFieldsConfig['rules'],
  stats: any
): { tag: string; buffer: string }[] {
  // Example: could add logic to sanitize subrecord buffers if needed
  // For now, just return as is
  return recordArr;
}

export function createSanitizeFieldsProcessor(config: SanitizeFieldsConfig): Processor {
  let stats = {
    recordsProcessed: 0,
    fieldsProcessed: 0,
    fieldsRemoved: 0,
    fieldsReplaced: 0,
  };

  return {
    async transform(data: JsonArray): Promise<JsonArray> {
      stats.recordsProcessed = data.length;
      stats.fieldsProcessed = 0;
      stats.fieldsRemoved = 0;
      stats.fieldsReplaced = 0;

      return data.map((record) => {
        const parsedRecord = record as ParsedRecord;
        // For now, only process meta and decodedData fields
        const newRecord: ParsedRecord = {
          meta: { ...parsedRecord.meta },
          record: processRecordSubrecords(parsedRecord.record, config.rules, stats),
          header: parsedRecord.header,
        };
        // Optionally process decodedData, decodedErrors, etc. if present
        if (parsedRecord.decodedData) newRecord.decodedData = { ...parsedRecord.decodedData };
        if (parsedRecord.decodedErrors) newRecord.decodedErrors = { ...parsedRecord.decodedErrors };
        return newRecord;
      });
    },
    getStats: () => stats,
  };
}
