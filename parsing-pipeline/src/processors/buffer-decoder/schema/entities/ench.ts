import { flagParserGenerator } from '../generics';
import { RecordSpecificSchemas } from '../schemaTypes';
import { createSchema } from '../createSchema';
import { CTDA_ARRAY_SCHEMA } from '../ctda/ctdaSchema';

// ENCH Flags from UESP documentation
export const ENCHFlags: Record<number, string> = {
  0x00000001: 'ManualCalc',
  0x00000004: 'ExtendDurationOnRecast',
};

// ENCH CastType enum from UESP documentation
export const ENCHCastType: Record<number, string> = {
  0x00: 'Constant Effect',
  0x01: 'Fire and Forget',
  0x02: 'Concentration',
};

// ENCH Delivery enum from UESP documentation
export const ENCHDelivery: Record<number, string> = {
  0x00: 'Self',
  0x01: 'Touch',
  0x02: 'Aimed',
  0x03: 'Target Actor',
  0x04: 'Target Location',
};

// ENCH EnchantType enum from UESP documentation
export const ENCHEnchantType: Record<number, string> = {
  0x06: 'Enchantment',
  0x0c: 'Staff Enchantment',
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
      {
        name: 'castType',
        type: 'uint32',
        parser: (value: number) => ENCHCastType[value] || `Unknown(${value})`,
      },
      { name: 'chargeAmount', type: 'uint32' },
      { name: 'enchantmentAmount', type: 'uint32' },
      {
        name: 'delivery',
        type: 'uint32',
        parser: (value: number) => ENCHDelivery[value] || `Unknown(${value})`,
      },
      {
        name: 'enchantmentType',
        type: 'uint32',
        parser: (value: number) => ENCHEnchantType[value] || `Unknown(${value})`,
      },
      { name: 'chargeTime', type: 'float32' },
      { name: 'baseEnchantment', type: 'formid' },
      { name: 'wornRestrictions', type: 'formid' },
    ],
  },
  // Effect ID - Magic Effect MGEF
  EFID: { type: 'formid' },
  // Effect data - 12 bytes: magnitude (float32) + area (uint32) + duration (uint32)
  EFIT: {
    type: 'struct',
    size: 12,
    fields: [
      { name: 'magnitude', type: 'float32' },
      { name: 'area', type: 'uint32' },
      { name: 'duration', type: 'uint32' },
    ],
  },
  // Conditions (array of CTDA) - optional
  CTDA: CTDA_ARRAY_SCHEMA,
  // VMAD (Papyrus script data) - optional, variable binary
  VMAD: { type: 'unknown' },
});
