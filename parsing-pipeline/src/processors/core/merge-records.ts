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
  console.log(`[DEBUG] extractArrayValues: fieldPath="${fieldPath}"`);

  // Handle array field paths like 'decodedData.perkSections[].PNAM'
  if (fieldPath.includes('[]')) {
    const [basePath, arrayField] = fieldPath.split('[]');
    console.log(`[DEBUG] Array path detected: basePath="${basePath}", arrayField="${arrayField}"`);

    // Trim leading dot from arrayField if present
    const cleanArrayField = arrayField.startsWith('.') ? arrayField.substring(1) : arrayField;
    console.log(`[DEBUG] Cleaned arrayField: "${cleanArrayField}"`);

    const baseValue = getNestedValue(record, basePath);
    console.log(`[DEBUG] Base value:`, baseValue);

    if (Array.isArray(baseValue)) {
      console.log(`[DEBUG] Base value is array with ${baseValue.length} items`);
      const result = baseValue
        .map((item, index) => {
          //   console.log(`[DEBUG] Processing array item ${index}:`, item);
          if (typeof item === 'object' && item !== null && item !== undefined) {
            const extracted = getNestedValue(item, cleanArrayField);
            console.log(`[DEBUG] Extracted from item ${index}:`, extracted);
            return extracted;
          }
          console.log(`[DEBUG] Item ${index} is not an object, returning as-is:`, item);
          return item;
        })
        .filter((val) => val !== undefined);
      console.log(`[DEBUG] Final extracted values:`, result);
      return result;
    } else {
      console.log(`[DEBUG] Base value is not an array:`, typeof baseValue);
    }
  }

  // Single value
  const value = getNestedValue(record, fieldPath);
  console.log(`[DEBUG] Single value extraction:`, value);
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

        // Debug: Show first few source records
        console.log(`[DEBUG] First source record keys:`, Object.keys(sourceRecords[0] || {}));
        if (sourceRecords[0]) {
          console.log(`[DEBUG] First source record meta:`, sourceRecords[0].meta);
        }
      } catch (error) {
        console.error(`[ERROR] Failed to load source records:`, error);
        throw new Error(
          `Failed to load source records from ${config.sourceFile}: ${error instanceof Error ? error.message : String(error)}`
        );
      }

      // Build lookup maps for each mapping
      const lookupMaps = new Map<string, Map<any, ParsedRecord[]>>();

      for (const mapping of config.mappings) {
        console.log(`[DEBUG] Building lookup map for source field: ${mapping.sourceField}`);
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
        console.log(
          `[DEBUG] Built map with ${sourceMap.size} unique keys for ${mapping.sourceField}`
        );

        // Debug: Show first few entries
        const firstFew = Array.from(sourceMap.entries()).slice(0, 3);
        console.log(
          `[DEBUG] Sample map entries:`,
          firstFew.map(([key, records]) => ({
            key,
            count: records.length,
            sampleEdid: records[0]?.meta?.type,
          }))
        );
      }

      const result = data.map((targetRecord: ParsedRecord) => {
        recordsProcessed++;
        const mergedData: Record<string, any> = {};

        // Debug: Show target record structure
        if (recordsProcessed === 1) {
          console.log(`[DEBUG] First target record keys:`, Object.keys(targetRecord));
          console.log(`[DEBUG] First target record meta:`, targetRecord.meta);
          console.log(`[DEBUG] First target record decodedData:`, targetRecord.decodedData);
        }

        // Process each mapping
        for (const mapping of config.mappings) {
          console.log(
            `[DEBUG] Processing mapping: ${mapping.sourceField} -> ${mapping.targetField}`
          );

          const targetValues = extractArrayValues(mapping.targetField, targetRecord);
          console.log(`[DEBUG] Extracted target values for ${mapping.targetField}:`, targetValues);

          const sourceMap = lookupMaps.get(mapping.sourceField);
          if (!sourceMap) {
            console.error(`[ERROR] No lookup map found for source field: ${mapping.sourceField}`);
            continue;
          }

          // Track matches for this mapping
          const mappingMatches: any[] = [];

          for (const targetValue of targetValues) {
            if (targetValue === undefined || targetValue === null) {
              console.log(`[DEBUG] Skipping null/undefined target value`);
              continue;
            }

            // Skip null references (0x00000000 in Skyrim)
            if (targetValue === '0x00000000' || targetValue === 0 || targetValue === '0') {
              console.log(`[DEBUG] Skipping null reference: ${targetValue}`);
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
              console.log(
                `[DEBUG] Replaced ${mapping.targetField} with ${flatReplacementValues.length} referenced records`
              );
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
