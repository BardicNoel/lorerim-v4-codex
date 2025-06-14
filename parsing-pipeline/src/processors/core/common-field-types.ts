import { FieldTypeConfig } from './decode-buffer-fields';

// Common field type definitions
export const COMMON_FIELD_TYPES: Record<string, FieldTypeConfig> = {
  // Basic fields
  EDID_FIELD: { 
    type: 'string', 
    encoding: 'utf8', 
    length: 0x200 
  }, // Max 0x200 bytes including null terminator

  FULL_FIELD: { 
    type: 'string', 
    encoding: 'utf8' 
  }, // Localized string

  // FormID fields
  FORMID_FIELD: { 
    type: 'formId' 
  },

  // Array fields
  FORMID_ARRAY_FIELD: { 
    type: 'formId' 
  }, // For arrays of FormIDs

  // Special fields
  VMAD_FIELD: { 
    type: 'string', 
    encoding: 'utf8' 
  }, // Virtual Machine Adapter

  CTDA_FIELD: { 
    type: 'string', 
    encoding: 'utf8' 
  }, // Condition data

  // Common data structures
  DATA_STRUCT_FIELD: { 
    type: 'string', 
    encoding: 'utf8' 
  }, // Generic data structure

  // Sound related
  SOUND_DATA_FIELD: { 
    type: 'string', 
    encoding: 'utf8' 
  }, // Sound data array
};

// Helper function to create a record type configuration
export function createRecordTypeConfig(
  recordType: string,
  fieldTypes: Record<string, FieldTypeConfig>
): Record<string, FieldTypeConfig> {
  return {
    ...COMMON_FIELD_TYPES,
    ...fieldTypes
  };
} 