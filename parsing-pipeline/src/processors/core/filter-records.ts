import { JsonArray, FilterRecordsConfig } from '../../types/pipeline';
import { Processor } from './index';
import { getNestedValue } from '../../utils/field-access';
import { ParsedRecord } from '@lorerim/platform-types';

function evaluateCriteria(record: ParsedRecord, criteria: FilterRecordsConfig['criteria']): boolean {
    return criteria.every(criterion => {
        const value = getNestedValue(record, criterion.field);
        
        // Handle undefined/null values
        if (value === undefined || value === null) {
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
            const result = data.filter(record => {
                const matches = evaluateCriteria(record as ParsedRecord, config.criteria);
                if (!matches) {
                    recordsFiltered++;
                }
                return matches;
            });

            return result;
        },

        getStats: () => ({
            recordsProcessed: totalRecords,
            recordsFiltered
        })
    };
} 