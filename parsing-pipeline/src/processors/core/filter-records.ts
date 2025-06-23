import { JsonArray, FilterRecordsConfig } from '../../types/pipeline';
import { Processor } from './index';
import { getNestedValue } from '../../utils/field-access';
import { ParsedRecord } from '@lorerim/platform-types';

function evaluateCriteria(
  record: ParsedRecord,
  criteria: FilterRecordsConfig['criteria']
): boolean {
  return criteria.every((criterion) => {
    const value = getNestedValue(record, criterion.field);

    // Debug logging for Wintersun filter
    if (criterion.field === 'propertyName') {
      console.log(
        `[DEBUG] Filter: field=${criterion.field}, value=${value}, operator=${criterion.operator}`
      );
      if (criterion.operator === 'in-list') {
        console.log(`[DEBUG] Filter: checking if ${value} is in list:`, criterion.value);
      }
    }

    // Handle undefined/null values
    if (value === undefined || value === null) {
      if (criterion.field === 'propertyName') {
        console.log(`[DEBUG] Filter: value is undefined/null for field ${criterion.field}`);
      }
      return false;
    }

    switch (criterion.operator) {
      case 'equals':
        return value === criterion.value;
      case 'not-equals':
        return value !== criterion.value;
      case 'contains':
        return typeof value === 'string' && value.includes(criterion.value);
      case 'not-contains':
        return typeof value === 'string' && !value.includes(criterion.value);
      case 'greater-than':
        return typeof value === 'number' && value > criterion.value;
      case 'less-than':
        return typeof value === 'number' && value < criterion.value;
      case 'in-list':
        const result = Array.isArray(criterion.value) && criterion.value.includes(value);
        if (criterion.field === 'propertyName') {
          console.log(`[DEBUG] Filter: in-list result = ${result}`);
        }
        return result;
      case 'not-in-list':
        return Array.isArray(criterion.value) && !criterion.value.includes(value);
      default:
        return false;
    }
  });
}

export function createFilterRecordsProcessor(config: FilterRecordsConfig): Processor {
  let recordsFiltered = 0;
  let totalRecords = 0;

  return {
    async transform(data: JsonArray): Promise<JsonArray> {
      totalRecords = data.length;
      console.log(`[DEBUG] Filter: Processing ${totalRecords} records`);

      // Log a sample record structure for debugging
      if (data.length > 0) {
        console.log(`[DEBUG] Filter: Sample record keys:`, Object.keys(data[0]));
        if (data[0].propertyName) {
          console.log(`[DEBUG] Filter: Sample propertyName:`, data[0].propertyName);
        }
      }

      const result = data.filter((record) => {
        const matches = evaluateCriteria(record as ParsedRecord, config.criteria);
        if (!matches) {
          recordsFiltered++;
        }
        return matches;
      });

      console.log(
        `[DEBUG] Filter: Kept ${result.length} records, filtered out ${recordsFiltered} records`
      );

      return result;
    },

    getStats: () => ({
      recordsProcessed: totalRecords,
      recordsFiltered,
    }),
  };
}
