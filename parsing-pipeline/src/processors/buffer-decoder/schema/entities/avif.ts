import { FieldSchema, RecordSpecificSchemas, SchemaInternal } from '../schemaTypes';
import { createSchema } from '../createSchema';

// AVIF-specific fields (common fields will be added by createSchema)
const avifSpecificFields: SchemaInternal = {
  // Abbreviation (only present on 1Hand/2Hand AV records)
  ANAM: {
    type: 'string' as const,
    encoding: 'utf8' as const,
  },

  // Data - Skill category or large 4byte info
  CNAM: {
    type: 'uint32' as const,
  },

  // AV data (only present for skills with groupings)
  AVSK: {
    type: 'array' as const,
    element: {
      type: 'float32' as const,
    },
  },

  // Perk tree sections - grouped field that processes consecutive perk sections
  PNAM: {
    type: 'grouped' as const,
    virtualField: 'perkSections', // Group will be assigned to this field
    cardinality: 'multiple' as const,
    terminatorTag: 'PNAM', // This will stop processing when we hit the next record's EDID
    groupSchema: {
      // PNAM - Perk formid (or 0 for the first)
      PNAM: { name: 'perk', type: 'formid' as const },

      // FNAM - Flag (most common values are 1 and 0, first perk has huge values)
      FNAM: { name: 'flag', type: 'uint32' as const },

      // XNAM - X coordinate within the Perk-Grid
      XNAM: { name: 'x', type: 'uint32' as const },

      // YNAM - Y coordinate within the Perk-Grid
      YNAM: { name: 'y', type: 'uint32' as const },

      // HNAM - Horizontal position within the grid
      HNAM: { name: 'horizontal', type: 'float32' as const },

      // VNAM - Vertical position within the grid
      VNAM: { name: 'vertical', type: 'float32' as const },

      // SNAM - Skill formid (same as parent usually)
      SNAM: { name: 'skill', type: 'formid' as const },

      // CNAM - Connecting line (ID of destination perk, can be 0 or multiple)
      CNAM: { name: 'connections', type: 'array' as const, element: { type: 'uint32' as const } },

      // INAM - Index number (unique id for the perk box, not necessarily sequential)
      INAM: { name: 'index', type: 'uint32' as const },
    },
  },
};

// AVIF Record Schema based on UESP documentation
export const avifSchema: RecordSpecificSchemas = createSchema('AVIF', avifSpecificFields);
