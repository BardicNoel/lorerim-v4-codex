import { JsonArray } from '../../types/pipeline';
import { Processor } from './index';

export interface RenameFieldsConfig {
  name: string;
  type: 'rename-fields';
  mappings: {
    [oldFieldPath: string]: string; // old path -> new field name
  };
}

function renameFieldInObject(obj: any, oldPath: string, newName: string): boolean {
  const parts = oldPath.split('.');
  let current = obj;

  // Navigate to the parent of the field to rename
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (current && typeof current === 'object' && part in current) {
      current = current[part];
    } else {
      return false; // Path not found
    }
  }

  const oldFieldName = parts[parts.length - 1];
  if (current && typeof current === 'object' && oldFieldName in current) {
    // Rename the field
    const value = current[oldFieldName];
    delete current[oldFieldName];
    current[newName] = value;
    return true;
  }

  return false;
}

function renameFieldsInArray(
  obj: any,
  arrayPath: string,
  mappings: { [oldFieldPath: string]: string }
): number {
  // Handle array notation like 'perkSections[]'
  const cleanPath = arrayPath.replace('[]', '');
  const parts = cleanPath.split('.');
  let current = obj;

  // Navigate to the array
  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part];
    } else {
      return 0; // Path not found
    }
  }

  if (!Array.isArray(current)) {
    return 0;
  }

  let renamedCount = 0;

  // Process each element in the array
  current.forEach((element, index) => {
    if (typeof element === 'object' && element !== null) {
      // Apply mappings to this array element
      for (const [oldPath, newName] of Object.entries(mappings)) {
        if (renameFieldInObject(element, oldPath, newName)) {
          renamedCount++;
        }
      }
    }
  });

  return renamedCount;
}

export function createRenameFieldsProcessor(config: RenameFieldsConfig): Processor {
  let fieldsRenamed = 0;
  let totalRecords = 0;

  return {
    async transform(data: JsonArray): Promise<JsonArray> {
      totalRecords = data.length;

      return data.map((record) => {
        // Create a deep copy to avoid mutating the original
        const processedRecord = JSON.parse(JSON.stringify(record));

        // Group mappings by whether they target arrays or regular fields
        const arrayMappings: { [arrayPath: string]: { [oldFieldPath: string]: string } } = {};
        const regularMappings: { [oldFieldPath: string]: string } = {};

        for (const [oldPath, newName] of Object.entries(config.mappings)) {
          if (oldPath.includes('[]')) {
            // This is an array mapping
            const arrayPath = oldPath.split('[]')[0] + '[]';
            const fieldPath = oldPath.split('[]')[1].substring(1); // Remove leading dot

            if (!arrayMappings[arrayPath]) {
              arrayMappings[arrayPath] = {};
            }
            arrayMappings[arrayPath][fieldPath] = newName;
          } else {
            // This is a regular field mapping
            regularMappings[oldPath] = newName;
          }
        }

        // Process regular field mappings
        for (const [oldPath, newName] of Object.entries(regularMappings)) {
          if (renameFieldInObject(processedRecord, oldPath, newName)) {
            fieldsRenamed++;
          }
        }

        // Process array field mappings
        for (const [arrayPath, mappings] of Object.entries(arrayMappings)) {
          const count = renameFieldsInArray(processedRecord, arrayPath, mappings);
          fieldsRenamed += count;
        }

        return processedRecord;
      });
    },

    getStats: () => ({
      recordsProcessed: totalRecords,
      fieldsRenamed,
    }),
  };
}
