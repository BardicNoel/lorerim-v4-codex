import { JsonArray, JsonRecord, ProcessingResult } from '../../types/pipeline';
import { Processor } from './index';

interface RepairJsonConfig {
  maxAttempts: number;
  strictMode: boolean;
  preserveOriginal: boolean;
}

interface RepairStats extends ProcessingResult {
  recordsProcessed: number;
  recordsRepaired: number;
  badCharsReplaced: number;
  unclosedObjectsFixed: number;
  doubleCommasFixed: number;
  missingCommasFixed: number;
}

function repairJsonString(jsonStr: string, stats: RepairStats): string {
  let result = jsonStr;
  let attempts = 0;

  while (attempts < 3) {
    try {
      // Try to parse the JSON to see if it's valid
      JSON.parse(result);
      return result;
    } catch (error) {
      attempts++;
      
      // Fix double commas
      result = result.replace(/,\s*,/g, ',');
      if (result !== jsonStr) stats.doubleCommasFixed++;

      // Fix missing commas between objects
      result = result.replace(/}\s*{/g, '},{');
      if (result !== jsonStr) stats.missingCommasFixed++;

      // Fix unclosed objects
      const openBraces = (result.match(/{/g) || []).length;
      const closeBraces = (result.match(/}/g) || []).length;
      if (openBraces > closeBraces) {
        result = result + '}'.repeat(openBraces - closeBraces);
        stats.unclosedObjectsFixed++;
      }

      // Replace bad characters
      const badCharRegex = /[^\x20-\x7E]/g;
      const badChars = result.match(badCharRegex);
      if (badChars) {
        result = result.replace(badCharRegex, (char) => {
          stats.badCharsReplaced++;
          return `{BAD_CHAR:${char.charCodeAt(0)}}`;
        });
      }
    }
  }

  return result;
}

export function createRepairJsonProcessor(config: RepairJsonConfig): Processor {
  const stats: RepairStats = {
    recordsProcessed: 0,
    recordsRepaired: 0,
    badCharsReplaced: 0,
    unclosedObjectsFixed: 0,
    doubleCommasFixed: 0,
    missingCommasFixed: 0
  };

  return {
    async transform(data: JsonArray): Promise<JsonArray> {
      stats.recordsProcessed = data.length;
      
      return data.map(record => {
        const originalJson = JSON.stringify(record);
        const repairedJson = repairJsonString(originalJson, stats);
        
        if (repairedJson !== originalJson) {
          stats.recordsRepaired++;
        }

        try {
          return JSON.parse(repairedJson);
        } catch (error) {
          if (config.preserveOriginal) {
            return record;
          }
          throw new Error(`Failed to repair JSON after ${config.maxAttempts} attempts`);
        }
      });
    },

    getStats: () => stats
  };
} 