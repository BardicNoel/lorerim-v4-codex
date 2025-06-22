import { FieldSchema, RecordSpecificSchemas, SchemaInternal } from '../schemaTypes';
import { createSchema } from '../createSchema';
import { flagParserGenerator } from '../generics';

// AVIF Skill Category Flags (CNAM field)
export const AVIFSkillCategories: Record<number, string> = {
  0x00000000: 'None',
  0x00000001: 'Combat',
  0x00000002: 'Magic',
  0x00000003: 'Stealth',
};

// AVIF Perk Section Flags (FNAM field)
export const AVIFPerkSectionFlags: Record<number, string> = {
  0x00000000: 'Normal',
  0x00000001: 'First Perk',
  0x00000002: 'Root Perk',
  0x00000004: 'Branch Start',
  0x00000008: 'Branch End',
  0x00000010: 'Cross Connection',
  0x00000020: 'Hidden Perk',
  0x00000040: 'Special Perk',
  0x00000080: 'Quest Perk',
  0x00000100: 'Faction Perk',
  0x00000200: 'Race Perk',
  0x00000400: 'Gender Perk',
  0x00000800: 'Level Perk',
  0x00001000: 'Skill Perk',
  0x00002000: 'Attribute Perk',
  0x00004000: 'Combat Perk',
  0x00008000: 'Magic Perk',
  0x00010000: 'Stealth Perk',
  0x00020000: 'Crafting Perk',
  0x00040000: 'Social Perk',
  0x00080000: 'Movement Perk',
  0x00100000: 'Survival Perk',
  0x00200000: 'Lore Perk',
  0x00400000: 'Unique Perk',
  0x00800000: 'Legendary Perk',
  0x01000000: 'Master Perk',
  0x02000000: 'Expert Perk',
  0x04000000: 'Adept Perk',
  0x08000000: 'Novice Perk',
  0x10000000: 'Apprentice Perk',
  0x20000000: 'Journeyman Perk',
  0x40000000: 'Unknown Flag 30',
  0x80000000: 'Unknown Flag 31',
};

// AVIF Perk Connection Types (CNAM field within perkSections)
export const AVIFPerkConnectionTypes: Record<number, string> = {
  0: 'No Connection',
  1: 'Root Connection',
  2: 'Branch Start',
  3: 'Branch End',
  4: 'Cross Connection',
  5: 'Parallel Connection',
  6: 'Prerequisite Connection',
  7: 'Dependent Connection',
  8: 'Alternative Connection',
  9: 'Special Connection',
  10: 'Master Connection',
  11: 'Expert Connection',
  12: 'Adept Connection',
  13: 'Novice Connection',
  14: 'Apprentice Connection',
  15: 'Journeyman Connection',
};

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
    parser: (value: number) => {
      // Map skill category values to readable names
      return AVIFSkillCategories[value] || `Unknown Category (${value})`;
    },
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
      FNAM: {
        name: 'flag',
        type: 'uint32' as const,
        parser: flagParserGenerator(AVIFPerkSectionFlags),
      },

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
      CNAM: {
        name: 'connections',
        type: 'array' as const,
        element: {
          type: 'uint32' as const,
        },
      },

      // INAM - Index number (unique id for the perk box, not necessarily sequential)
      INAM: { name: 'index', type: 'uint32' as const },
    },
  },
};

// AVIF Record Schema based on UESP documentation
export const avifSchema: RecordSpecificSchemas = createSchema('AVIF', avifSpecificFields);
