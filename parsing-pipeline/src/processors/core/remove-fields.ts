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
  console.log(`[DEBUG] processNestedFields called with fields:`, fields, `path:`, path);

  for (const [key, value] of Object.entries(fields)) {
    const currentPath = [...path, key];
    const trimType = determineTrimType(value);

    console.log(`[DEBUG] Processing key: ${key}, value:`, value, `trimType: ${trimType}`);

    switch (trimType) {
      case 'all':
        trimAll(obj, key, currentPath);
        break;
      case 'field':
        trimFields(obj, key, [String(value)], currentPath);
        break;
      case 'object':
        if (key.includes('[]')) {
          // Handle array notation within nested objects
          const arrayKey = key.slice(0, -2); // Remove '[]'
          console.log(`[DEBUG] Found array notation: ${key}, arrayKey: ${arrayKey}`);

          if (obj[arrayKey] && Array.isArray(obj[arrayKey])) {
            console.log(
              `[DEBUG] Processing array ${arrayKey} with ${obj[arrayKey].length} elements`
            );
            obj[arrayKey].forEach((element, index) => {
              if (typeof element === 'object' && element !== null) {
                if (Array.isArray(value)) {
                  // Remove specific fields from array elements
                  console.log(`[DEBUG] Removing fields from element ${index}:`, value);
                  value.forEach((field) => {
                    if (field in element) {
                      delete element[field];
                      console.log(`[DEBUG] Removed field ${field} from element ${index}`);
                    }
                  });
                } else if (typeof value === 'object' && value !== null) {
                  // Handle nested object removal within array elements
                  console.log(
                    `[DEBUG] Processing nested object removal in element ${index}:`,
                    value
                  );
                  for (const [nestedKey, nestedValue] of Object.entries(value)) {
                    if (
                      nestedKey in element &&
                      typeof element[nestedKey] === 'object' &&
                      element[nestedKey] !== null
                    ) {
                      if (Array.isArray(nestedValue)) {
                        // Remove specific fields from the nested object
                        nestedValue.forEach((fieldToRemove) => {
                          if (fieldToRemove in element[nestedKey]) {
                            delete element[nestedKey][fieldToRemove];
                            console.log(
                              `[DEBUG] Removed nested field ${fieldToRemove} from ${nestedKey} in element ${index}`
                            );
                          }
                        });
                      }
                    }
                  }
                }
              }
            });
          } else {
            console.log(`[DEBUG] Array ${arrayKey} not found or not an array in obj:`, obj);
          }
        } else {
          trimObject(obj, key, value as Record<string, any>, currentPath);
        }
        break;
      case 'array':
        trimArray(obj, key, value as any[], currentPath);
        break;
    }
  }
}

function removeFieldsFromArrayElements(
  obj: any,
  fieldPath: string,
  fieldsToRemove: string[]
): void {
  const parts = fieldPath.split('.');
  let current = obj;

  // Navigate to the array
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (current && typeof current === 'object' && part in current) {
      current = current[part];
    } else {
      return; // Path not found
    }
  }

  // Check if the last part ends with '[]' and we have an array
  const lastPart = parts[parts.length - 1];
  if (lastPart.endsWith('[]')) {
    const arrayKey = lastPart.slice(0, -2); // Remove '[]'
    if (current && typeof current === 'object' && arrayKey in current) {
      const array = current[arrayKey];
      if (Array.isArray(array)) {
        // Remove specified fields from each element in the array
        array.forEach((element) => {
          if (typeof element === 'object' && element !== null) {
            fieldsToRemove.forEach((field) => {
              if (field in element) {
                delete element[field];
              }
            });
          }
        });
      }
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
    // Handle nested field configuration
    for (const [fieldPath, fieldConfig] of Object.entries(fields)) {
      console.log(`[DEBUG] Processing field path: ${fieldPath}, config:`, fieldConfig);

      if (fieldConfig === 'all') {
        // Remove entire field
        const parts = fieldPath.split('.');
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
          console.log(`[DEBUG] Removed field: ${fieldPath}`);
        }
      } else if (Array.isArray(fieldConfig)) {
        // Check if this is a mixed array config (contains both strings and objects)
        const hasMixedTypes =
          fieldConfig.some((item) => typeof item === 'object') &&
          fieldConfig.some((item) => typeof item === 'string');

        console.log(`[DEBUG] Array config detected:`, fieldConfig);
        console.log(`[DEBUG] Has mixed types: ${hasMixedTypes}`);
        console.log(`[DEBUG] Field path includes []: ${fieldPath.includes('[]')}`);
        console.log(
          `[DEBUG] Types in config:`,
          fieldConfig.map((item) => typeof item)
        );
        console.log(
          `[DEBUG] Condition evaluation: hasMixedTypes=${hasMixedTypes} && includes[]=${fieldPath.includes('[]')} = ${hasMixedTypes && fieldPath.includes('[]')}`
        );

        if (hasMixedTypes && fieldPath.includes('[]')) {
          // Handle mixed array configuration
          console.log(`[DEBUG] Processing mixed array config for ${fieldPath}:`, fieldConfig);
          console.log(`[DEBUG] ABOUT TO CALL processMixedArrayConfig`);
          processMixedArrayConfig(obj, fieldPath, fieldConfig);
        } else if (fieldPath.includes('[]')) {
          // Handle simple array field removal
          console.log(
            `[DEBUG] Processing simple array field removal for ${fieldPath}:`,
            fieldConfig
          );
          removeFieldsFromArrayElements(obj, fieldPath, fieldConfig as string[]);
        } else {
          // Handle regular nested field configuration
          console.log(
            `[DEBUG] Processing regular nested field config for ${fieldPath}:`,
            fieldConfig
          );
          processNestedFields(obj, { [fieldPath]: fieldConfig });
        }
      } else if (typeof fieldConfig === 'object' && fieldConfig !== null) {
        // Handle nested object configuration like 'decodedData: { perkSections[]: [...] }'
        const parts = fieldPath.split('.');
        let current = obj;

        // Navigate to the target object
        for (const part of parts) {
          if (current && typeof current === 'object' && part in current) {
            current = current[part];
          } else {
            current = null;
            break;
          }
        }

        // Process the nested configuration on the target object
        if (current && typeof current === 'object') {
          console.log(`[DEBUG] Processing nested config for ${fieldPath}:`, fieldConfig);
          processNestedFields(current, fieldConfig);
        }
      }
    }
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

function processMixedArrayConfig(obj: any, arrayPath: string, mixedConfig: any[]): void {
  console.log(
    `[DEBUG] processMixedArrayConfig called with arrayPath: ${arrayPath}, mixedConfig:`,
    mixedConfig
  );
  console.log(`[DEBUG] Starting object keys:`, Object.keys(obj));

  // Navigate to the array - handle perkSections[] syntax
  const cleanPath = arrayPath.replace('[]', ''); // Remove [] from the path
  const parts = cleanPath.split('.');
  let current = obj;

  for (const part of parts) {
    console.log(
      `[DEBUG] Navigating to part: ${part}, current keys:`,
      current ? Object.keys(current) : 'null'
    );
    if (current && typeof current === 'object' && part in current) {
      current = current[part];
    } else {
      console.log(`[DEBUG] Path not found: ${arrayPath}`);
      return; // Path not found
    }
  }

  if (!Array.isArray(current)) {
    console.log(`[DEBUG] Not an array: ${arrayPath}`);
    return;
  }

  console.log(`[DEBUG] Found array with ${current.length} elements`);

  // Process each element in the array
  current.forEach((element, index) => {
    if (typeof element === 'object' && element !== null) {
      console.log(`[DEBUG] Processing element ${index}:`, element);

      // Process each item in the mixed config
      mixedConfig.forEach((configItem) => {
        console.log(`[DEBUG] Processing config item:`, configItem, `type:`, typeof configItem);

        if (typeof configItem === 'string') {
          // Simple field removal
          if (configItem in element) {
            delete element[configItem];
            console.log(`[DEBUG] Removed field ${configItem} from element ${index}`);
          } else {
            console.log(`[DEBUG] Field ${configItem} not found in element ${index}`);
          }
        } else if (typeof configItem === 'object' && configItem !== null) {
          // Nested object removal
          console.log(`[DEBUG] Processing nested object config:`, configItem);
          for (const [nestedKey, nestedFields] of Object.entries(configItem)) {
            console.log(`[DEBUG] Processing nested key: ${nestedKey}, fields:`, nestedFields);
            if (
              nestedKey in element &&
              typeof element[nestedKey] === 'object' &&
              element[nestedKey] !== null
            ) {
              if (Array.isArray(nestedFields)) {
                nestedFields.forEach((fieldToRemove) => {
                  if (fieldToRemove in element[nestedKey]) {
                    delete element[nestedKey][fieldToRemove];
                    console.log(
                      `[DEBUG] Removed nested field ${fieldToRemove} from ${nestedKey} in element ${index}`
                    );
                  } else {
                    console.log(
                      `[DEBUG] Nested field ${fieldToRemove} not found in ${nestedKey} of element ${index}`
                    );
                  }
                });
              }
            } else {
              console.log(
                `[DEBUG] Nested key ${nestedKey} not found or not an object in element ${index}`
              );
            }
          }
        }
      });
    }
  });
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
