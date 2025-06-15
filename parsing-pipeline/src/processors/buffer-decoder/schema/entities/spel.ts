import { RecordSpecificSchemas } from '../schemaTypes';
import { sharedFields } from '../fullSchema';
import { createSchema } from '../createSchema';
import { flagParserGenerator } from '../generics';

// SPEL SPIT flags
const SPEL_FLAGS = {
  0x00000001: 'notAutoCalculate',
  0x00010000: 'unknown1',
  0x00020000: 'pcStartSpell',
  0x00040000: 'unknown2',
  0x00080000: 'areaEffectIgnoresLineOfSight',
  0x00100000: 'ignoreResistance',
  0x00200000: 'disallowSpellAbsorbReflect',
  0x00400000: 'unknown3',
  0x00800000: 'noDualCastModifications',
};

// SPEL SPIT type enum
const SPEL_TYPE = {
  0x00: 'Spell',
  0x01: 'Disease',
  0x02: 'Power',
  0x03: 'LesserPower',
  0x04: 'Ability',
  0x05: 'Poison',
  0x0a: 'Addiction',
  0x0b: 'Voice',
};

// SPEL SPIT cast type enum
const SPEL_CAST_TYPE = {
  0x00: 'ConstantEffect',
  0x01: 'FireAndForget',
  0x02: 'Concentration',
};

// SPEL SPIT delivery type enum
const SPEL_DELIVERY = {
  0x00: 'Self',
  0x01: 'Contact',
  0x02: 'Aimed',
  0x03: 'TargetActor',
  0x04: 'TargetLocation',
};

export const spelSchema: RecordSpecificSchemas = createSchema('SPEL', {
  // Editor ID
  EDID: {
    type: 'string',
    encoding: 'utf8',
  },
  // Object Bounds
  OBND: {
    type: 'struct',
    fields: [
      { name: 'x1', type: 'uint16' },
      { name: 'y1', type: 'uint16' },
      { name: 'z1', type: 'uint16' },
      { name: 'x2', type: 'uint16' },
      { name: 'y2', type: 'uint16' },
      { name: 'z2', type: 'uint16' },
    ],
  },
  // Full Name
  FULL: {
    type: 'string',
    encoding: 'utf8',
  },
  // Menu Display Object
  MDOB: {
    type: 'formid',
  },
  // Equip Type
  ETYP: {
    type: 'formid',
  },
  // Description
  DESC: {
    type: 'string',
    encoding: 'utf8',
  },
  // Spell Data
  SPIT: {
    type: 'struct',
    fields: [
      { name: 'spellCost', type: 'uint32' },
      {
        name: 'flags',
        type: 'uint32',
        parser: flagParserGenerator(SPEL_FLAGS),
      },
      {
        name: 'type',
        type: 'uint32',
        parser: (value: number) =>
          SPEL_TYPE[value as keyof typeof SPEL_TYPE] || `Unknown(${value})`,
      },
      { name: 'chargeTime', type: 'float32' },
      {
        name: 'castType',
        type: 'uint32',
        parser: (value: number) =>
          SPEL_CAST_TYPE[value as keyof typeof SPEL_CAST_TYPE] || `Unknown(${value})`,
      },
      {
        name: 'delivery',
        type: 'uint32',
        parser: (value: number) =>
          SPEL_DELIVERY[value as keyof typeof SPEL_DELIVERY] || `Unknown(${value})`,
      },
      { name: 'castDuration', type: 'float32' },
      { name: 'range', type: 'float32' },
      { name: 'halfCostPerk', type: 'formid' },
    ],
  },
  // Spell Effects
  EFID: {
    type: 'array',
    element: {
      type: 'formid',
    },
  },
  EFIT: {
    type: 'array',
    element: {
      type: 'struct',
      fields: [
        {
          name: 'magnitude',
          type: 'float32',
          parser: (value: number) => {
            console.log('[DEBUG] EFIT magnitude:', { value, hex: value.toString(16) });
            return value;
          },
        },
        {
          name: 'area',
          type: 'uint32',
          parser: (value: number) => {
            console.log('[DEBUG] EFIT area:', { value, hex: value.toString(16) });
            return value;
          },
        },
        {
          name: 'duration',
          type: 'uint32',
          parser: (value: number) => {
            console.log('[DEBUG] EFIT duration:', { value, hex: value.toString(16) });
            return value;
          },
        },
      ],
    },
  },
  // Conditions
  //   CTDA: {
  //     type: 'array',
  //     element: {
  //       type: 'struct',
  //       fields: sharedFields.conditionBlock,
  //     },
  //   },
});
