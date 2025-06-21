import { RecordSpecificSchemas } from '../schemaTypes';
import { createSchema } from '../createSchema';
import { sharedFields } from '../createSchema';

export const perkSchema: RecordSpecificSchemas = createSchema('PERK', {
  // Main DATA block with perk flags and rank info
  // According to UESP: uint8[5] - IsTrait, Level, NumRanks, IsPlayable, IsHidden
  DATA: {
    type: 'struct',
    fields: [
      { name: 'isTrait', type: 'uint8' },
      { name: 'level', type: 'uint8' },
      { name: 'numRanks', type: 'uint8' },
      { name: 'isPlayable', type: 'uint8' },
      { name: 'isHidden', type: 'uint8' },
    ],
  },

  // CTDA - Condition data for the perk to be available to the player
  CTDA: {
    type: 'array',
    element: {
      type: 'struct',
      size: 32, // CTDA is always 32 bytes
      fields: sharedFields.conditionBlock,
    },
  },

  // Perk sections - grouped field that starts with PRKE and includes all section fields
  // This ensures that DATA fields are parsed in the correct context
  PRKE: {
    type: 'grouped',
    virtualField: 'sections', // Group will be assigned to this field
    cardinality: 'multiple',
    terminatorTag: 'PRKE', // Stop when we hit the next section's PRKE
    groupSchema: {
      // PRKE - Perk section header (uint8[3])
      PRKE: {
        type: 'struct',
        fields: sharedFields.perkSectionHeader,
      },

      // PRKC - Condition type logic (only in Complex Entry Point sections)
      PRKC: {
        type: 'uint8',
      },

      // CTDA - Condition data for the section
      CTDA: {
        type: 'array',
        element: {
          type: 'struct',
          size: 32,
          fields: sharedFields.conditionBlock,
        },
      },

      // EPFT - Entry point effect type
      EPFT: {
        type: 'uint8',
      },

      // EPF2 - Extra data for certain EPFTs
      EPF2: {
        type: 'unknown', // Will be parsed dynamically based on EPFT
      },

      // EPF3 - Additional data for certain EPFTs
      EPF3: {
        type: 'uint32',
      },

      // EPFD - Payload data (variable format based on EPFT)
      EPFD: {
        type: 'unknown', // Will be parsed dynamically based on EPFT
      },

      // DATA - Section-specific data (different format per section type)
      // This will be parsed as unknown for now, we'll handle the dynamic parsing next
      DATA: {
        type: 'unknown', // Will be parsed dynamically based on section type
      },

      // PRKF - Section terminator
      PRKF: {
        type: 'unknown', // Just a marker, no data
      },
    },
  },
});
