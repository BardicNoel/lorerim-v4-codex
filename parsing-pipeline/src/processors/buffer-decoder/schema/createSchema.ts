import { RecordSpecificSchemas, CommonFields, SchemaInternal, SharedFields } from './schemaTypes';

// Shared internal field layouts that can be composed into larger structs
export const sharedFields: SharedFields = {
  flags8: [{ name: 'flags', type: 'uint8' }],
  flags32: [{ name: 'flags', type: 'uint32' }],
  conditionBlock: [
    { name: 'op', type: 'uint8' },
    { name: 'value', type: 'float32' },
    { name: 'functionIndex', type: 'uint32' },
  ],
};

// Common field schemas that are reused across record types
export const commonFieldSchemas: CommonFields = {
  EDID: { type: 'string', encoding: 'utf8' },
  FULL: { type: 'string', encoding: 'utf8' },
  DESC: { type: 'string', encoding: 'utf8' },
  ICON: { type: 'string', encoding: 'utf8' }, // Used in many visual records
  DNAM: { type: 'string', encoding: 'utf8' },
  KSIZ: { type: 'uint32' },
  KWDA: { type: 'array', element: { type: 'formid' } },
  NNAM: { type: 'formid' },
};

/**
 * Creates a schema by merging common fields with record-specific fields
 * @param recordType The type of record (e.g., 'SPEL', 'MGEF', 'PERK')
 * @param schema The record-specific schema that must include all common fields
 * @returns A complete schema with both common and record-specific fields
 */
export const createSchema = (recordName: string, schema: SchemaInternal): RecordSpecificSchemas => {
  // Create a new schema that merges common fields with record-specific fields
  return {
    [recordName]: {
      // Add common fields first
      ...commonFieldSchemas,
      // Then add record-specific fields, which will override any common fields with the same name
      ...schema,
    },
  } as RecordSpecificSchemas;
};
