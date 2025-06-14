import { JsonArray, RemoveFieldsConfig } from '../../types/pipeline';
import { Processor } from './index';
import { getNestedValue, setNestedValue } from '../../utils/field-access';
import { ParsedRecord } from '@lorerim/platform-types';

function processNestedFields(obj: Record<string, any>, fields: any, path: string[] = []): void {
    for (const [key, value] of Object.entries(fields)) {
        const currentPath = [...path, key];
        
        if (value === 'all') {
            // Remove the entire field
            delete obj[key];
        } else if (Array.isArray(value)) {
            // Remove specific fields from an object
            for (const field of value) {
                if (obj[key] && typeof obj[key] === 'object') {
                    delete obj[key][field];
                }
            }
        } else if (typeof value === 'object' && value !== null) {
            // Recursively process nested objects
            if (obj[key] && typeof obj[key] === 'object') {
                processNestedFields(obj[key], value, currentPath);
            }
        }
    }
}

export function createRemoveFieldsProcessor(config: RemoveFieldsConfig): Processor {
    let fieldsRemoved = 0;
    let totalRecords = 0;

    return {
        async transform(data: JsonArray): Promise<JsonArray> {
            totalRecords = data.length;
            
            return data.map(record => {
                const parsedRecord = record as ParsedRecord;
                const newRecord: ParsedRecord = {
                    meta: { ...parsedRecord.meta },
                    data: { ...parsedRecord.data },
                    header: parsedRecord.header
                };
                processNestedFields(newRecord.data, config.fields);
                return newRecord;
            });
        },

        getStats: () => ({
            recordsProcessed: totalRecords,
            fieldsRemoved
        })
    };
} 