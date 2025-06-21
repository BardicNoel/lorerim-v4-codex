import { JsonArray, MergeRecordsConfig } from '../../types/pipeline';
import { Processor } from './index';
import { getNestedValue, setNestedValue } from '../../utils/field-access';
import { ParsedRecord } from '@lorerim/platform-types';
import { promises as fs } from 'fs';

interface MergeMapping {
  sourceField: string; // Field path in source records (e.g., 'decodedData.perkSections[].PNAM')
  targetField: string; // Field path in target records (e.g., 'meta.formId')
  matchType: 'exact' | 'contains' | 'array-contains'; // How to match values
}

interface MergeConfig {
  sourceFile: string; // Path to the source records file
  sourceRecordType: string; // Type of source records (e.g., 'PERK')
  mappings: MergeMapping[]; // Field mappings between source and target
  mergeField: string; // Field to store merged data in target records (e.g., 'mergedData')
  mergeStrategy: 'first' | 'all' | 'count'; // How to handle multiple matches
  overwriteReference?: boolean; // If true, replace original field values with referenced records
}

function extractArrayValues(fieldPath: string, record: ParsedRecord): any[] {
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
      return result;
    }
  }

  // Single value
  const value = getNestedValue(record, fieldPath);
  return value !== undefined ? [value] : [];
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

        for (const sourceRecord of sourceRecords) {
          const sourceValue = getNestedValue(sourceRecord, mapping.sourceField);

          if (sourceValue !== undefined && sourceValue !== null) {
            if (!sourceMap.has(sourceValue)) {
              sourceMap.set(sourceValue, []);
            }
            sourceMap.get(sourceValue)!.push(sourceRecord);
          }
        }

        lookupMaps.set(mapping.sourceField, sourceMap);
      }

      const result = data.map((targetRecord: ParsedRecord) => {
        recordsProcessed++;
        const mergedData: Record<string, any> = {};

        // Process each mapping
        for (const mapping of config.mappings) {
          const targetValues = extractArrayValues(mapping.targetField, targetRecord);

          const sourceMap = lookupMaps.get(mapping.sourceField);
          if (!sourceMap) {
            console.error(`[ERROR] No lookup map found for source field: ${mapping.sourceField}`);
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

              // Apply merge strategy
              let mergedValue: any;
              switch (config.mergeStrategy) {
                case 'first':
                  mergedValue = matches[0];
                  break;
                case 'all':
                  mergedValue = matches;
                  break;
                case 'count':
                  mergedValue = matches.length;
                  break;
                default:
                  mergedValue = matches[0];
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
              // Replace the original field values with the referenced records
              const replacementValues = mappingMatches.map((match) => match.sourceRecords);
              const flatReplacementValues =
                config.mergeStrategy === 'all' ? replacementValues.flat() : replacementValues;

              // Replace the original field values
              setNestedValue(targetRecord, mapping.targetField, flatReplacementValues);
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

        // Add merged data to target record
        if (Object.keys(mergedData).length > 0) {
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
