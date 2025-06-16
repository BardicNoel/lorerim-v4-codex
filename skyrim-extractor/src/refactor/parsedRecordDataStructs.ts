import { ParsedRecord } from "@lorerim/platform-types";

export function mergeTypeDictionaries(arr: ParsedRecord[]): Record<string, ParsedRecord[]> {
    const merged: Record<string, ParsedRecord[]> = {};
  
    for (const record of arr) {
      if (!merged[record.meta.type]) merged[record.meta.type] = [];
      merged[record.meta.type].push(record);
    }
  
  return merged;
}