import { RecordSpecificSchemas, CommonFields, SchemaInternal, SharedFields } from './schemaTypes';

// Shared internal field layouts that can be composed into larger structs
export const sharedFields: SharedFields = {
  flags8: [{ name: 'flags', type: 'uint8' }],
  flags32: [{ name: 'flags', type: 'uint32' }],
  conditionBlock: [
    { name: 'op', type: 'uint8' },
    { name: 'value', type: 'float32' },
    { name: 'functionIndex', type: 'uint32' },
    { name: 'param1', type: 'formid' },
    { name: 'param2', type: 'formid' },
    { name: 'runOnType', type: 'uint32' },
    { name: 'reference', type: 'formid' },
    { name: 'unknown', type: 'uint32' },
  ],
  // PERK-specific shared fields
  perkSectionHeader: [
    { name: 'sectionType', type: 'uint8' }, // 0=Quest, 1=Ability, 2=Complex Entry Point
    { name: 'rank', type: 'uint8' },
    { name: 'priority', type: 'uint8' },
  ],
  questData: [
    { name: 'questId', type: 'formid' },
    { name: 'stage', type: 'uint8' },
    { name: 'padding', type: 'uint8' },
    { name: 'padding2', type: 'uint8' },
    { name: 'padding3', type: 'uint8' },
  ],
  abilityData: [{ name: 'spellId', type: 'formid' }],
  complexData: [
    { name: 'effectType', type: 'uint8' },
    { name: 'functionType', type: 'uint8' },
    { name: 'conditionCount', type: 'uint8' },
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
