import { JsonArray, JsonRecord, RemoveFieldsConfig } from '../../types/pipeline';
import { Processor } from './index';
import { getNestedValue } from '../../utils/field-access';

function shouldRemoveField(record: JsonRecord, field: string, value?: string): boolean {
    const fieldValue = getNestedValue(record, field);
    
    // If no value is specified, just remove the field
    if (!value) {
        return true;
    }

    // If field value is a string, check if it contains the specified value
    if (typeof fieldValue === 'string') {
        return fieldValue.includes(value);
    }

    return false;
}

export function createRemoveFieldsProcessor(config: RemoveFieldsConfig): Processor {
    let fieldsRemoved = 0;
    let totalRecords = 0;

    return {
        async transform(data: JsonArray): Promise<JsonArray> {
            totalRecords = data.length;
            
            return data.map(record => {
                const newRecord = { ...record };
                
                for (const field of config.fields) {
                    if (shouldRemoveField(record, field, config.value)) {
                        delete newRecord[field];
                        fieldsRemoved++;
                    }
                }
                
                return newRecord;
            });
        },

        getStats: () => ({
            recordsProcessed: totalRecords,
            fieldsRemoved
        })
    };
} 