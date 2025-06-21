import { RecordSpecificSchemas } from '../schemaTypes';
import { createSchema } from '../createSchema';

export const perkSchema: RecordSpecificSchemas = createSchema('PERK', {
  // Main DATA block with perk flags and rank info
  // According to UESP: uint8[5] - IsTrait, Level, NumRanks, IsPlayable, IsHidden
  DATA: {
    type: 'array',
    element: { type: 'uint8' },
  },

  // Perk section header - PRKE is uint8[3] according to UESP
  PRKE: {
    type: 'struct',
    fields: [
      { name: 'sectionType', type: 'uint8' }, // 0=Quest, 1=Ability, 2=Complex Entry Point
      { name: 'rank', type: 'uint8' },
      { name: 'priority', type: 'uint8' },
    ],
  },

  // Complex-entry points: condition type logic
  PRKC: {
    type: 'uint8',
  },

  // Entry-point effects, interpreted dynamically
  EPFT: {
    type: 'uint8',
  }, // Effect data type code

  // Payload data - these are variable length based on EPFT
  EPFD: {
    type: 'unknown',
  }, // Payload (float/formid/string depending on EPFT)

  EPF2: {
    type: 'unknown',
  }, // Extra data for certain EPFTs

  EPF3: {
    type: 'uint32',
  }, // Additional int32 if EPFT=04/05

  // Section terminator — marks end of section
  PRKF: {
    type: 'unknown',
  },

  // Quest section data (when PRKE.sectionType = 0)
  // DATA in quest section is uint8[8] - formid + stage + 3 null bytes
  // This is handled by the generic DATA field above

  // Ability section data (when PRKE.sectionType = 1)
  // DATA in ability section is formid (spell ID)
  // This is handled by the generic DATA field above

  // Complex Entry Point section data (when PRKE.sectionType = 2)
  // DATA in complex section is uint8[3] - EffectType + FunctionType + CondTypeCount
  // This is handled by the generic DATA field above
});
