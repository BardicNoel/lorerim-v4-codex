import { flagParserGenerator } from '../generics';
import { RecordSpecificSchemas } from '../schemaTypes';
import { createSchema } from '../createSchema';

export const ENCHFlags: Record<number, string> = {
  0x00000001: 'Manual Cost Calc',
  0x00000002: 'Unknown',
  0x00000004: 'Extend Duration on Recast',
  0x00000008: 'Unknown',
  0x00000010: 'Unknown',
  0x00000020: 'Unknown',
  0x00000040: 'Unknown',
  0x00000080: 'Unknown',
  0x00000100: 'Unknown',
  0x00000200: 'Unknown',
  0x00000400: 'Unknown',
  0x00000800: 'Unknown',
  0x00001000: 'Unknown',
  0x00002000: 'Unknown',
  0x00004000: 'Unknown',
  0x00008000: 'Unknown',
  0x00010000: 'Unknown',
  0x00020000: 'Unknown',
  0x00040000: 'Unknown',
  0x00080000: 'Unknown',
  0x00100000: 'Unknown',
  0x00200000: 'Unknown',
  0x00400000: 'Unknown',
  0x00800000: 'Unknown',
  0x01000000: 'Unknown',
  0x02000000: 'Unknown',
  0x04000000: 'Unknown',
  0x08000000: 'Unknown',
  0x10000000: 'Unknown',
  0x20000000: 'Unknown',
  0x40000000: 'Unknown',
  0x80000000: 'Unknown',
};

export const enchSchema: RecordSpecificSchemas = createSchema('ENCH', {
  // Editor ID
  EDID: { type: 'string', encoding: 'utf8' },
  // Full name
  FULL: { type: 'string', encoding: 'utf8' },
  // Enchantment cost
  ENIT: {
    type: 'struct',
    fields: [
      { name: 'enchantmentCost', type: 'uint32' },
      { name: 'flags', type: 'uint32', parser: flagParserGenerator(ENCHFlags) },
      { name: 'castType', type: 'uint32' },
      { name: 'chargeAmount', type: 'uint32' },
      { name: 'enchantmentAmount', type: 'uint32' },
      { name: 'enchantmentType', type: 'uint32' },
      { name: 'chargeTime', type: 'float32' },
      { name: 'baseEnchantment', type: 'formid' },
      { name: 'wornRestrictions', type: 'formid' },
    ],
  },
  // Effects array
  EFID: { type: 'array', element: { type: 'formid' } }, // Effect IDs
  EFIT: {
    type: 'array',
    element: {
      type: 'struct',
      fields: [
        { name: 'magnitude', type: 'float32' },
        { name: 'area', type: 'uint32' },
        { name: 'duration', type: 'uint32' },
      ],
    },
  },
  // Conditions (array of CTDA)
  CTDA: { type: 'array', element: { type: 'unknown' } },
  // VMAD (Papyrus script data) - optional, variable binary
  VMAD: { type: 'unknown' },
});
