import { JsonArray, JsonRecord, SanitizeFieldsConfig } from '../../types/pipeline';
import { Processor } from './index';

function isExcludedField(fieldPath: string, excludeFields?: string[]): boolean {
    if (!excludeFields) return false;
    return excludeFields.some(excluded => fieldPath.startsWith(excluded));
}

function processObject(
    obj: Record<string, any>,
    rules: SanitizeFieldsConfig['rules'],
    currentPath: string = '',
    stats: { fieldsProcessed: number; fieldsRemoved: number; fieldsReplaced: number }
): Record<string, any> {
    const result: Record<string, any> = {};

    for (const [key, value] of Object.entries(obj)) {
        const fieldPath = currentPath ? `${currentPath}.${key}` : key;
        stats.fieldsProcessed++;

        // Skip excluded fields
        if (isExcludedField(fieldPath, rules[0]?.excludeFields)) {
            result[key] = value;
            continue;
        }

        // Handle nested objects
        if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
            result[key] = processObject(value, rules, fieldPath, stats);
            continue;
        }

        // Handle arrays
        if (Array.isArray(value)) {
            result[key] = value.map(item => 
                typeof item === 'object' && item !== null
                    ? processObject(item, rules, fieldPath, stats)
                    : item
            );
            continue;
        }

        // Handle primitive values
        if (typeof value === 'string') {
            const rule = rules[0]; // For now, we only use the first rule
            if (value.includes(rule.pattern)) {
                if (rule.action === 'remove') {
                    stats.fieldsRemoved++;
                    continue; // Skip this field
                } else if (rule.action === 'replace' && rule.replacement !== undefined) {
                    stats.fieldsReplaced++;
                    result[key] = rule.replacement;
                    continue;
                }
            }
        }

        // Keep the original value if no rules matched
        result[key] = value;
    }

    return result;
}

export function createSanitizeFieldsProcessor(config: SanitizeFieldsConfig): Processor {
    let stats = {
        recordsProcessed: 0,
        fieldsProcessed: 0,
        fieldsRemoved: 0,
        fieldsReplaced: 0
    };

    return {
        async transform(data: JsonArray): Promise<JsonArray> {
            stats.recordsProcessed = data.length;
            stats.fieldsProcessed = 0;
            stats.fieldsRemoved = 0;
            stats.fieldsReplaced = 0;

            return data.map(record => 
                processObject(record, config.rules, '', stats)
            );
        },

        getStats: () => stats
    };
} 