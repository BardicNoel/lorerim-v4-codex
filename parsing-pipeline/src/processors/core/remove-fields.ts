import { JsonArray, JsonRecord, RemoveFieldsConfig } from '../../types/pipeline';
import { Processor } from './index';
import { getNestedValue } from '../../utils/field-access';

function flattenFieldPaths(obj: any, prefix: string = ''): string[] {
    const paths: string[] = [];
    
    for (const [key, value] of Object.entries(obj)) {
        const currentPath = prefix ? `${prefix}.${key}` : key;
        
        if (Array.isArray(value)) {
            // If the value is an array, each item is a field name at this path
            value.forEach(field => {
                paths.push(`${currentPath}.${field}`);
            });
        } else if (typeof value === 'object' && value !== null) {
            // If the value is an object, recursively process it
            paths.push(...flattenFieldPaths(value, currentPath));
        }
    }
    
    return paths;
}

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

    // Flatten the nested field structure into dot-notation paths
    const fieldPaths = flattenFieldPaths(config.fields);

    return {
        async transform(data: JsonArray): Promise<JsonArray> {
            totalRecords = data.length;
            
            return data.map(record => {
                const newRecord = { ...record };
                
                for (const field of fieldPaths) {
                    if (shouldRemoveField(record, field, config.value)) {
                        const parts = field.split('.');
                        let current: any = newRecord;
                        
                        // Navigate to the parent object
                        for (let i = 0; i < parts.length - 1; i++) {
                            if (current[parts[i]] === undefined) {
                                break;
                            }
                            current = current[parts[i]];
                        }
                        
                        // Remove the field if we found its parent
                        if (current && typeof current === 'object') {
                            delete current[parts[parts.length - 1]];
                            fieldsRemoved++;
                        }
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