import { JsonArray, RemoveFieldsConfig } from '../../types/pipeline';
import { Processor } from './index';

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

function removeFieldsFromObject(obj: any, fields: any): void {
  if (typeof obj !== 'object' || obj === null) {
    return;
  }

  if (Array.isArray(fields)) {
    // Simple array of field paths
    for (const field of fields) {
      const parts = field.split('.');
      let current = obj;

      // Navigate to the parent of the field to remove
      for (let i = 0; i < parts.length - 1; i++) {
        if (current && typeof current === 'object' && parts[i] in current) {
          current = current[parts[i]];
        } else {
          current = null;
          break;
        }
      }

      // Remove the field if we found its parent
      if (current && typeof current === 'object' && parts[parts.length - 1] in current) {
        delete current[parts[parts.length - 1]];
      }
    }
  } else if (typeof fields === 'object' && fields !== null) {
    // Complex nested field configuration
    processNestedFields(obj, fields);
  }
}

function meetsConditions(obj: any, conditions?: any[]): boolean {
  if (!conditions || conditions.length === 0) {
    return true;
  }

  for (const condition of conditions) {
    const { field, operator, value } = condition;
    const parts = field.split('.');
    let current = obj;

    // Navigate to the field
    for (const part of parts) {
      if (current && typeof current === 'object' && part in current) {
        current = current[part];
      } else {
        current = undefined;
        break;
      }
    }

    let matches = false;
    switch (operator) {
      case 'equals':
        matches = current === value;
        break;
      case 'not-equals':
        matches = current !== value;
        break;
      case 'contains':
        matches = typeof current === 'string' && current.includes(value);
        break;
      case 'not-contains':
        matches = typeof current === 'string' && !current.includes(value);
        break;
      default:
        matches = false;
    }

    if (!matches) {
      return false;
    }
  }

  return true;
}

export function createRemoveFieldsProcessor(config: RemoveFieldsConfig): Processor {
  let fieldsRemoved = 0;
  let totalRecords = 0;

  return {
    async transform(data: JsonArray): Promise<JsonArray> {
      totalRecords = data.length;

      return data.map((record) => {
        // Check if record meets conditions before processing
        if (!meetsConditions(record, config.conditions)) {
          return record;
        }

        // Create a deep copy to avoid mutating the original
        const processedRecord = JSON.parse(JSON.stringify(record));

        // Remove fields based on configuration
        removeFieldsFromObject(processedRecord, config.fields);

        // Count removed fields (this is a rough estimate)
        fieldsRemoved += 1; // Increment for each processed record

        return processedRecord;
      });
    },
    getStats: () => ({
      recordsProcessed: totalRecords,
      fieldsRemoved,
    }),
  };
}
