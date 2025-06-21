import { RecordSpecificSchemas, FieldSchema } from '../schemaTypes';
import { createSchema } from '../createSchema';
import { sharedFields } from '../createSchema';

// Section-specific schemas based on PRKE section type
const questSectionSchema: { [tag: string]: FieldSchema } = {
  CIS2: { type: 'unknown' },
  DATA: {
    type: 'struct' as const,
    fields: [
      { name: 'questId', type: 'formid' as const },
      { name: 'stage', type: 'uint8' as const },
      { name: 'padding', type: 'uint8' as const },
      { name: 'padding2', type: 'uint8' as const },
      { name: 'padding3', type: 'uint8' as const },
    ],
  },
  PRKF: {
    type: 'unknown' as const, // Just a marker, no data
  },
};

const perkConditionalSchema: { [tag: string]: FieldSchema } = {
  CIS2: { type: 'unknown' },
  PRKC: {
    type: 'uint8' as const,
  },
  CTDA: {
    type: 'array' as const,
    element: {
      type: 'struct' as const,
      size: 32,
      fields: sharedFields.conditionBlock,
    },
  },
};

const abilitySectionSchema: { [tag: string]: FieldSchema } = {
  ...perkConditionalSchema,
  DATA: {
    type: 'struct' as const,
    fields: [{ name: 'spellId', type: 'formid' as const }],
  },
  CTDA: {
    type: 'array' as const,
    element: {
      type: 'struct' as const,
      size: 32,
      fields: sharedFields.conditionBlock,
    },
  },
  PRKF: {
    type: 'unknown' as const, // Just a marker, no data
  },
  CIS2: { type: 'unknown' },
};

const complexSectionSchema: { [tag: string]: FieldSchema } = {
  ...perkConditionalSchema,
  DATA: {
    type: 'struct' as const,
    fields: [
      { name: 'effectType', type: 'uint8' as const },
      { name: 'functionType', type: 'uint8' as const },
      { name: 'conditionCount', type: 'uint8' as const },
    ],
  },
  EPFT: {
    type: 'uint8' as const,
  },
  EPF2: {
    type: 'unknown' as const, // Will be parsed dynamically based on EPFT
  },
  EPF3: {
    type: 'uint32' as const,
  },
  EPFD: {
    type: 'unknown' as const, // Will be parsed dynamically based on EPFT
  },
  PRKF: {
    type: 'unknown' as const, // Just a marker, no data
  },
  CIS2: { type: 'unknown' },
};

export const perkSchema: RecordSpecificSchemas = createSchema('PERK', {
  // Main DATA block with perk flags and rank info
  // According to UESP: uint8[5] - IsTrait, Level, NumRanks, IsPlayable, IsHidden
  DATA: {
    type: 'struct' as const,
    fields: [
      { name: 'isTrait', type: 'uint8' as const },
      { name: 'level', type: 'uint8' as const },
      { name: 'numRanks', type: 'uint8' as const },
      { name: 'isPlayable', type: 'uint8' as const },
      { name: 'isHidden', type: 'uint8' as const },
    ],
  },

  // CTDA - Condition data for the perk to be available to the player
  CTDA: {
    type: 'array' as const,
    element: {
      type: 'struct' as const,
      size: 32, // CTDA is always 32 bytes
      fields: sharedFields.conditionBlock,
    },
  },

  // Perk sections - grouped field that starts with PRKE and includes all section fields
  // This ensures that DATA fields are parsed in the correct context
  PRKE: {
    type: 'grouped' as const,
    virtualField: 'sections', // Group will be assigned to this field
    cardinality: 'multiple' as const,
    terminatorTag: 'PRKE', // Stop when we hit the next section's PRKE
    groupSchema: {
      // PRKE - Perk section header (uint8[3])
      PRKE: {
        type: 'struct' as const,
        fields: sharedFields.perkSectionHeader,
      },
    },
    dynamicSchema: (parsedPRKE: any) => {
      const sectionType = parsedPRKE.sectionType;
      switch (sectionType) {
        case 0: // Quest section
          return questSectionSchema;
        case 1: // Ability section
          return abilitySectionSchema;
        case 2: // Complex Entry Point section
          return complexSectionSchema;
        default:
          console.warn(`[WARN] Unknown section type: ${sectionType}`);
          return { PRKF: { type: 'unknown' } };
      }
    },
  },
});
