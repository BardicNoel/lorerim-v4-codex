import { sharedFields } from '../fullSchema';
import { RecordSpecificSchemas } from '../schemaTypes';
import { createSchema } from '../createSchema';

export const perkSchema: RecordSpecificSchemas = createSchema('PERK', {
  // Main DATA block with perk flags and rank info
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

  //
  // NNAM: If present, points to the next perk in the chain (included in common fields)

  // TODO Conditions gating perk availability
  // CTDA: {
  //   type: 'array',
  //   element: {
  //     type: 'struct',
  //     fields: sharedFields.conditionBlock,
  //   },
  // },

  // Each perk section: Quest (0), Ability (1), or Complex Entry Point (2)
  PRKE: {
    type: 'struct',
    fields: [
      { name: 'sectionType', type: 'uint8' }, // 0,1,2
      { name: 'rank', type: 'uint8' },
      { name: 'priority', type: 'uint8' },
    ],
  },

  // Data specific to each section type — initially raw bytes
  PRKD: { type: 'unknown' }, // Structure depends on PRKE.sectionType

  // Complex-entry points: condition type logic
  PRKC: {
    type: 'struct',
    fields: [{ name: 'condType', type: 'uint8' }],
  },

  // Entry-point effects, interpreted dynamically
  EPFT: { type: 'uint8' }, // Effect data type code
  EPFD: { type: 'unknown' }, // Payload (float/formid/string depending on EPFT)
  EPF2: { type: 'unknown' }, // Extra data for certain EPFTs
  EPF3: { type: 'uint32' }, // Additional int32 if EPFT=04/05

  // Section terminator — marks end of section
  PRKF: { type: 'unknown' },
});
