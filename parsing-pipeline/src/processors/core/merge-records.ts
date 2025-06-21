import { JsonArray, MergeRecordsConfig } from '../../types/pipeline';
import { Processor } from './index';
import { getNestedValue, setNestedValue } from '../../utils/field-access';
import { ParsedRecord } from '@lorerim/platform-types';
import { promises as fs } from 'fs';

interface MergeMapping {
  sourceField: string; // Field path in source records (e.g., 'decodedData.perkSections[].PNAM')
  targetField: string; // Field path in target records (e.g., 'meta.formId')
  matchType: 'exact' | 'contains' | 'array-contains'; // How to match values
  matchField?: string; // Field to match on in source records (defaults to sourceField if not specified)
  dataField?: string; // Field to pull data from in source records (defaults to entire record if not specified)
}

interface MergeConfig {
  sourceFile: string; // Path to the source records file
  sourceRecordType: string; // Type of source records (e.g., 'PERK')
  mappings: MergeMapping[]; // Field mappings between source and target
  mergeField: string; // Field to store merged data in target records (e.g., 'mergedData')
  mergeStrategy: 'first' | 'all' | 'count'; // How to handle multiple matches
  overwriteReference?: boolean; // If true, replace original field values with referenced records
}

function extractArrayValues(
  fieldPath: string,
  record: ParsedRecord
): { values: any[]; isArray: boolean; basePath?: string; arrayField?: string } {
  // Handle array field paths like 'decodedData.perkSections[].PNAM'
  if (fieldPath.includes('[]')) {
    const [basePath, arrayField] = fieldPath.split('[]');

    // Trim leading dot from arrayField if present
    const cleanArrayField = arrayField.startsWith('.') ? arrayField.substring(1) : arrayField;

    const baseValue = getNestedValue(record, basePath);

    if (Array.isArray(baseValue)) {
      const result = baseValue
        .map((item, index) => {
          if (typeof item === 'object' && item !== null && item !== undefined) {
            const extracted = getNestedValue(item, cleanArrayField);
            return extracted;
          }
          return item;
        })
        .filter((val) => val !== undefined);
      return { values: result, isArray: true, basePath, arrayField: cleanArrayField };
    }
  }

  // Single value
  const value = getNestedValue(record, fieldPath);
  return {
    values: value !== undefined ? [value] : [],
    isArray: false,
  };
}

function replaceArrayElement(
  record: ParsedRecord,
  basePath: string,
  arrayField: string,
  targetValue: any,
  replacement: any
): boolean {
  const baseValue = getNestedValue(record, basePath);

  if (!Array.isArray(baseValue)) {
    return false;
  }

  for (let i = 0; i < baseValue.length; i++) {
    const item = baseValue[i];
    if (typeof item === 'object' && item !== null && item !== undefined) {
      const itemValue = getNestedValue(item, arrayField);
      if (itemValue === targetValue) {
        // Replace only the specific field value with the matched record
        setNestedValue(item, arrayField, replacement);
        return true;
      }
    }
  }

  return false;
}

export function createMergeRecordsProcessor(config: MergeRecordsConfig): Processor {
  let recordsProcessed = 0;
  let recordsMerged = 0;
  let totalMatches = 0;

  return {
    async transform(data: JsonArray): Promise<JsonArray> {
      console.log(`[INFO] Loading source records from: ${config.sourceFile}`);

      // Load source records
      let sourceRecords: ParsedRecord[];
      try {
        const sourceContent = await fs.readFile(config.sourceFile, 'utf-8');
        const sourceData = JSON.parse(sourceContent);
        sourceRecords = Array.isArray(sourceData) ? sourceData : sourceData.data || [];
        console.log(`[INFO] Loaded ${sourceRecords.length} source records`);
      } catch (error) {
        console.error(`[ERROR] Failed to load source records:`, error);
        throw new Error(
          `Failed to load source records from ${config.sourceFile}: ${error instanceof Error ? error.message : String(error)}`
        );
      }

      // Build lookup maps for each mapping
      const lookupMaps = new Map<string, Map<any, ParsedRecord[]>>();

      for (const mapping of config.mappings) {
        const sourceMap = new Map<any, ParsedRecord[]>();
        const matchField = mapping.matchField || mapping.sourceField;
        const mappingKey = `${mapping.sourceField}_${mapping.targetField}`;

        for (const sourceRecord of sourceRecords) {
          const sourceValue = getNestedValue(sourceRecord, matchField);

          if (sourceValue !== undefined && sourceValue !== null) {
            if (!sourceMap.has(sourceValue)) {
              sourceMap.set(sourceValue, []);
            }
            sourceMap.get(sourceValue)!.push(sourceRecord);
          }
        }

        lookupMaps.set(mappingKey, sourceMap);
      }

      const result = data.map((targetRecord: ParsedRecord) => {
        recordsProcessed++;
        const mergedData: Record<string, any> = {};

        // Process each mapping
        for (const mapping of config.mappings) {
          const {
            values: targetValues,
            isArray,
            basePath,
            arrayField,
          } = extractArrayValues(mapping.targetField, targetRecord);

          const mappingKey = `${mapping.sourceField}_${mapping.targetField}`;
          const sourceMap = lookupMaps.get(mappingKey);
          if (!sourceMap) {
            console.error(`[ERROR] No lookup map found for mapping: ${mappingKey}`);
            continue;
          }

          // Track matches for this mapping
          const mappingMatches: any[] = [];

          for (const targetValue of targetValues) {
            if (targetValue === undefined || targetValue === null) {
              continue;
            }

            // Skip null references (0x00000000 in Skyrim)
            if (targetValue === '0x00000000' || targetValue === 0 || targetValue === '0') {
              continue;
            }

            // O(1) lookup instead of linear search
            const matches = sourceMap.get(targetValue) || [];

            if (matches.length === 0) {
              console.warn(`[WARN] No matches found for target value: ${targetValue}`);
            }

            if (matches.length > 0) {
              totalMatches += matches.length;

              // Apply merge strategy and extract data from the specified field
              let mergedValue: any;
              switch (config.mergeStrategy) {
                case 'first':
                  const firstMatch = matches[0];
                  mergedValue = mapping.dataField
                    ? getNestedValue(firstMatch, mapping.dataField)
                    : firstMatch;
                  break;
                case 'all':
                  mergedValue = matches.map((match) =>
                    mapping.dataField ? getNestedValue(match, mapping.dataField) : match
                  );
                  break;
                case 'count':
                  mergedValue = matches.length;
                  break;
                default:
                  const defaultMatch = matches[0];
                  mergedValue = mapping.dataField
                    ? getNestedValue(defaultMatch, mapping.dataField)
                    : defaultMatch;
              }

              mappingMatches.push({
                targetValue,
                sourceRecords: mergedValue,
                matchType: mapping.matchType,
              });
            }
          }

          // Handle the matches based on overwriteReference setting
          if (mappingMatches.length > 0) {
            if (config.overwriteReference) {
              // Replace individual array elements with their matched objects
              if (isArray && basePath && arrayField) {
                let replacedCount = 0;
                for (const match of mappingMatches) {
                  const replacement =
                    config.mergeStrategy === 'first' ? match.sourceRecords : match.sourceRecords;
                  if (
                    replaceArrayElement(
                      targetRecord,
                      basePath,
                      arrayField,
                      match.targetValue,
                      replacement
                    )
                  ) {
                    replacedCount++;
                  }
                }
                if (replacedCount > 0) {
                  recordsMerged++;
                }
              } else {
                // For non-array fields, replace the entire field
                const replacementValues = mappingMatches.map((match) => match.sourceRecords);
                const flatReplacementValues =
                  config.mergeStrategy === 'all' ? replacementValues.flat() : replacementValues;

                // Replace the original field values
                setNestedValue(targetRecord, mapping.targetField, flatReplacementValues);
                recordsMerged++;
              }
            } else {
              // Store in merged data (original behavior)
              const mappingKey = `${mapping.sourceField}_${mapping.targetField}`;
              if (!mergedData[mappingKey]) {
                mergedData[mappingKey] = [];
              }
              mergedData[mappingKey].push(...mappingMatches);
            }
          }
        }

        // Add merged data to target record (only if not using overwriteReference)
        if (!config.overwriteReference && Object.keys(mergedData).length > 0) {
          setNestedValue(targetRecord, config.mergeField, mergedData);
          recordsMerged++;
        }

        return targetRecord;
      });

      console.log(
        `[INFO] Merge completed: ${recordsMerged}/${recordsProcessed} records merged, ${totalMatches} total matches`
      );
      return result;
    },

    getStats: () => ({
      recordsProcessed,
      recordsMerged,
      totalMatches,
    }),
  };
}
