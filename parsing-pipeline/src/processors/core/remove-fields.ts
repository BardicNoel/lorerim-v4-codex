import { JsonArray, RemoveFieldsConfig } from '../../types/pipeline';
import { Processor } from './index';
import { getNestedValue, setNestedValue } from '../../utils/field-access';
import { ParsedRecord } from '@lorerim/platform-types';

type TrimType = 'all' | 'field' | 'object' | 'array';

function determineTrimType(value: any): TrimType {
  if (value === 'all') return 'all';
  if (Array.isArray(value)) return 'array';
  if (typeof value === 'object' && value !== null) return 'object';
  return 'field';
}

function trimAll(obj: Record<string, any>, key: string, path: string[]): void {
  delete obj[key];
}

function trimFields(obj: Record<string, any>, key: string, fields: string[], path: string[]): void {
  if (obj[key] && typeof obj[key] === 'object') {
    for (const field of fields) {
      if (field in obj[key]) {
        delete obj[key][field];
      }
    }
  }
}

function trimObject(
  obj: Record<string, any>,
  key: string,
  value: Record<string, any>,
  path: string[]
): void {
  if (obj[key]) {
    if (Array.isArray(obj[key])) {
      obj[key].forEach((item: any, index: number) => {
        if (typeof item === 'object' && item !== null) {
          processNestedFields(item, value, [...path, key, index.toString()]);
        }
      });
    } else if (typeof obj[key] === 'object') {
      processNestedFields(obj[key], value, [...path, key]);
    }
  }
}

function trimArray(obj: Record<string, any>, key: string, value: any[], path: string[]): void {
  if (obj[key] && typeof obj[key] === 'object') {
    for (const field of value) {
      if (typeof field === 'string' && field in obj[key]) {
        delete obj[key][field];
      } else if (typeof field === 'object') {
        for (const [nestedKey, nestedValue] of Object.entries(field)) {
          if (nestedKey in obj[key] && Array.isArray(nestedValue)) {
            for (const nestedField of nestedValue) {
              if (nestedField in obj[key][nestedKey]) {
                delete obj[key][nestedKey][nestedField];
              }
            }
          }
        }
      }
    }
  }
}

function processNestedFields(obj: Record<string, any>, fields: any, path: string[] = []): void {
  for (const [key, value] of Object.entries(fields)) {
    const currentPath = [...path, key];
    const trimType = determineTrimType(value);

    switch (trimType) {
      case 'all':
        trimAll(obj, key, currentPath);
        break;
      case 'field':
        trimFields(obj, key, [String(value)], currentPath);
        break;
      case 'object':
        trimObject(obj, key, value as Record<string, any>, currentPath);
        break;
      case 'array':
        trimArray(obj, key, value as any[], currentPath);
        break;
    }
  }
}

export function createRemoveFieldsProcessor(config: RemoveFieldsConfig): Processor {
  let fieldsRemoved = 0;
  let totalRecords = 0;

  return {
    async transform(data: JsonArray): Promise<JsonArray> {
      totalRecords = data.length;

      return data.map((record) => {
        const parsedRecord = record as ParsedRecord;
        let newRecordArr = [...parsedRecord.record];
        // Remove subrecords by tag if specified in config.fields
        if (Array.isArray(config.fields)) {
          for (const field of config.fields) {
            const parts = field.split('.');
            if (parts[0] === 'record') {
              const tag = parts[1];
              const before = newRecordArr.length;
              newRecordArr = newRecordArr.filter((r) => r.tag !== tag);
              fieldsRemoved += before - newRecordArr.length;
            }
          }
        }
        return {
          ...parsedRecord,
          record: newRecordArr,
        };
      });
    },
    getStats: () => ({
      recordsProcessed: totalRecords,
      fieldsRemoved,
    }),
  };
}
