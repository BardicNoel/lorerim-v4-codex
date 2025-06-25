import { JsonArray, ProcessingResult, FormIdResolverConfig } from '../../types/pipeline';
import { Processor } from './index';
import { promises as fs } from 'fs';
import { resolveGlobalFromReference, formatFormId, PluginMeta } from '@lorerim/platform-types';

/**
 * Deep clone an object to prevent mutations
 */
function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => deepClone(item)) as T;
  }

  const cloned = {} as T;
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      cloned[key] = deepClone(obj[key]);
    }
  }
  return cloned;
}

/**
 * Utility function to safely get nested object property
 */
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => {
    // Handle array notation like "scripts[0]" or "values[]"
    const arrayMatch = key.match(/^(.+)\[(\d*)\]$/);
    if (arrayMatch) {
      const arrayKey = arrayMatch[1];
      const index = arrayMatch[2];

      if (index === '') {
        // Handle wildcard notation like "values[]" - return the entire array
        return current && typeof current === 'object' ? current[arrayKey] : undefined;
      } else {
        // Handle specific index like "scripts[0]"
        const arrayIndex = parseInt(index);
        return current && typeof current === 'object' && Array.isArray(current[arrayKey])
          ? current[arrayKey][arrayIndex]
          : undefined;
      }
    }
    return current && typeof current === 'object' ? current[key] : undefined;
  }, obj);
}

/**
 * Utility function to safely set nested object property
 */
function setNestedValue(obj: any, path: string, value: any): void {
  const keys = path.split('.');
  const lastKey = keys.pop()!;

  const target = keys.reduce((current, key) => {
    if (!(key in current)) {
      current[key] = {};
    }
    return current[key];
  }, obj);

  target[lastKey] = value;
}

/**
 * Check if a record matches the condition
 */
function matchesCondition(
  record: any,
  condition: {
    field: string;
    operator: 'equals' | 'not-equals' | 'contains' | 'not-contains';
    value: any;
  }
): boolean {
  const value = getNestedValue(record, condition.field);

  switch (condition.operator) {
    case 'equals':
      return value === condition.value;
    case 'not-equals':
      return value !== condition.value;
    case 'contains':
      return typeof value === 'string' && value.includes(condition.value);
    case 'not-contains':
      return typeof value === 'string' && !value.includes(condition.value);
    default:
      return true;
  }
}

/**
 * Check if all conditions are met for a record
 */
function matchesAllConditions(
  record: any,
  conditions?: FormIdResolverConfig['conditions']
): boolean {
  if (!conditions || conditions.length === 0) return true;

  return conditions.every((condition) => matchesCondition(record, condition));
}

/**
 * Parse a FormID string or number to a number
 */
function parseFormId(formIdValue: string | number): number | null {
  if (typeof formIdValue === 'number') {
    // Already a number, return as is
    return formIdValue;
  }

  if (typeof formIdValue !== 'string') {
    return null;
  }

  // Remove any prefix and parse as hex
  const cleanFormId = formIdValue.replace(/^0x/i, '');

  // Try parsing as hex first
  let parsed = parseInt(cleanFormId, 16);

  // If hex parsing failed, try parsing as decimal
  if (isNaN(parsed)) {
    parsed = parseInt(cleanFormId, 10);
  }

  return isNaN(parsed) ? null : parsed;
}

export function createFormIdResolverProcessor(config: FormIdResolverConfig): Processor {
  let stats: ProcessingResult = {
    recordsProcessed: 0,
    formIdsResolved: 0,
    formIdsFailed: 0,
  };

  let pluginRegistry: Record<string, PluginMeta> = {};

  return {
    transform: async (data: JsonArray): Promise<JsonArray> => {
      stats.recordsProcessed = data.length;
      stats.formIdsResolved = 0;
      stats.formIdsFailed = 0;

      // Load plugin registry if not already loaded
      if (Object.keys(pluginRegistry).length === 0) {
        try {
          const registryData = await fs.readFile(config.pluginRegistryPath, 'utf-8');
          const registry = JSON.parse(registryData);

          // Convert to lowercase keys for case-insensitive lookup
          pluginRegistry = Object.fromEntries(
            Object.entries(registry).map(([key, value]) => [key.toLowerCase(), value as PluginMeta])
          );
        } catch (error) {
          console.error(`[FormID Resolver] Failed to load plugin registry: ${error}`);
          throw new Error(
            `Failed to load plugin registry: ${error instanceof Error ? error.message : String(error)}`
          );
        }
      }

      const processedData: JsonArray = [];

      for (const record of data) {
        // Create a deep copy of the record to avoid modifying the original
        const processedRecord = deepClone(record);

        // Check if record matches conditions
        if (!matchesAllConditions(processedRecord, config.conditions)) {
          processedData.push(processedRecord);
          continue;
        }

        // Get context plugin name
        const contextPluginName = getNestedValue(processedRecord, config.contextPluginField);
        if (!contextPluginName) {
          console.warn(`[FormID Resolver] No context plugin found for record`);
          processedData.push(processedRecord);
          continue;
        }

        const contextPlugin = pluginRegistry[contextPluginName.toLowerCase()];
        if (!contextPlugin) {
          console.warn(
            `[FormID Resolver] Context plugin "${contextPluginName}" not found in registry`
          );
          processedData.push(processedRecord);
          continue;
        }

        // Process each target field
        for (const targetField of config.targetFields) {
          // Check if this is an array field (contains [] notation)
          const isArrayField = targetField.field.includes('[]');

          if (isArrayField) {
            // Extract the base path without the field name after []
            const basePath = targetField.field.replace(/\[\]\.\w+$/, '[]');
            const fieldName = targetField.field.match(/\[\]\.(\w+)$/)?.[1];

            const arrayValue = getNestedValue(processedRecord, basePath);

            if (Array.isArray(arrayValue) && fieldName) {
              // Process array of objects with FormID fields
              let arrayResolvedCount = 0;
              let arrayFailedCount = 0;

              for (let i = 0; i < arrayValue.length; i++) {
                const item = arrayValue[i];

                // If the item is an object with the specified field, process it
                if (typeof item === 'object' && item !== null && fieldName in item) {
                  const formIdString = item[fieldName];
                  const rawFormId = parseFormId(formIdString);

                  if (rawFormId !== null) {
                    try {
                      const globalFormId = resolveGlobalFromReference(
                        rawFormId,
                        contextPlugin,
                        pluginRegistry
                      );

                      if (globalFormId !== null) {
                        const resolvedFormId = formatFormId(globalFormId);
                        // Add resolved formId to the original item
                        item[`${fieldName}_resolved`] = resolvedFormId;
                        arrayResolvedCount++;
                      } else {
                        console.warn(
                          `[FormID Resolver] Failed to resolve array FormID ${formIdString} for plugin ${contextPluginName}`
                        );
                        arrayFailedCount++;
                      }
                    } catch (error) {
                      console.warn(
                        `[FormID Resolver] Error resolving array FormID ${formIdString}: ${error}`
                      );
                      arrayFailedCount++;
                    }
                  } else {
                    console.warn(`[FormID Resolver] Invalid array FormID format: ${formIdString}`);
                    arrayFailedCount++;
                  }
                }
              }

              stats.formIdsResolved! += arrayResolvedCount;
              stats.formIdsFailed! += arrayFailedCount;
            } else {
              console.warn(
                `[FormID Resolver] Expected array for field ${targetField.field} but got: ${typeof arrayValue}`
              );
              stats.formIdsFailed!++;
            }
          } else {
            // Process single FormID value
            const formIdValue = getNestedValue(processedRecord, targetField.field);

            if (formIdValue !== undefined && formIdValue !== null) {
              const rawFormId = parseFormId(formIdValue);

              if (rawFormId !== null) {
                try {
                  const globalFormId = resolveGlobalFromReference(
                    rawFormId,
                    contextPlugin,
                    pluginRegistry
                  );

                  if (globalFormId !== null) {
                    const resolvedFormId = formatFormId(globalFormId);
                    const outputField = targetField.outputField || `${targetField.field}_resolved`;

                    // Set the custom output field if specified, otherwise use default
                    setNestedValue(processedRecord, outputField, resolvedFormId);

                    // Also set the default _resolved field for consistency
                    const defaultOutputField = `${targetField.field}_resolved`;
                    if (outputField !== defaultOutputField) {
                      setNestedValue(processedRecord, defaultOutputField, resolvedFormId);
                    }

                    stats.formIdsResolved!++;
                  } else {
                    console.warn(
                      `[FormID Resolver] Failed to resolve FormID ${formIdValue} for plugin ${contextPluginName}`
                    );
                    stats.formIdsFailed!++;
                  }
                } catch (error) {
                  console.warn(`[FormID Resolver] Error resolving FormID ${formIdValue}: ${error}`);
                  stats.formIdsFailed!++;
                }
              } else {
                console.warn(`[FormID Resolver] Invalid FormID format: ${formIdValue}`);
                stats.formIdsFailed!++;
              }
            }
          }
        }

        processedData.push(processedRecord);
      }

      return processedData;
    },
    getStats: () => stats,
  };
}
