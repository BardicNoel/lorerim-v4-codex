import { RecordSchema, SharedFields, RecordSpecificSchemas } from './types';

// Common field schemas that are reused across record types
export const commonFieldSchemas: RecordSchema = {
  EDID: { type: 'string', encoding: 'utf8' },
  FULL: { type: 'string', encoding: 'utf16le' },
  DESC: { type: 'string', encoding: 'utf16le' }
};

// Shared internal field layouts that can be composed into larger structs
export const sharedFields: SharedFields = {
  flags8: [{ name: 'flags', type: 'uint8' }],
  flags32: [{ name: 'flags', type: 'uint32' }],
  conditionBlock: [
    { name: 'op', type: 'uint8' },
    { name: 'value', type: 'float32' },
    { name: 'functionIndex', type: 'uint32' }
  ]
};

// Record-specific schemas that use common fields and shared fragments
export const recordSpecificSchemas: RecordSpecificSchemas = {
  PERK: {
    DATA: {
      type: 'struct',
      fields: [
        ...sharedFields.flags8,
        { name: 'levelReq', type: 'uint8' },
        { name: 'numPRKE', type: 'uint8' }
      ]
    }
  },
  CELL: {
    DATA: {
      type: 'struct',
      fields: [
        ...sharedFields.flags32,
        { name: 'lightLevel', type: 'uint8' }
      ]
    }
  },
  SPEL: {
    DATA: {
      type: 'struct',
      fields: [
        { name: 'spellType', type: 'uint32' },
        { name: 'cost', type: 'uint32' },
        ...sharedFields.conditionBlock
      ]
    }
  }
}; 