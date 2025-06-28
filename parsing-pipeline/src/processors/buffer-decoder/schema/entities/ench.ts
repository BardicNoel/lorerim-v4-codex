import { flagParserGenerator } from '../generics';
import { RecordSpecificSchemas } from '../schemaTypes';
import { createSchema } from '../createSchema';
import { EFID_EFFECTS_SCHEMA } from '../sharedFields/efidSchema';

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
  // Enchantment cost - 36 bytes total according to UESP
  ENIT: {
    type: 'struct',
    size: 36, // Explicitly set size to match UESP documentation
    fields: [
      { name: 'enchantmentCost', type: 'uint32' },
      { name: 'flags', type: 'uint32', parser: flagParserGenerator(ENCHFlags) },
      {
        name: 'castType',
        type: 'uint32',
        parser: (value: number) => ENCHCastType[value] || `Unknown(${value})`,
      },
      { name: 'enchAmount', type: 'uint32' }, // Fully charged value (same if no charges)
      {
        name: 'delivery',
        type: 'uint32',
        parser: (value: number) => ENCHDelivery[value] || `Unknown(${value})`,
      },
      {
        name: 'enchantType',
        type: 'uint32',
        parser: (value: number) => ENCHEnchantType[value] || `Unknown(${value})`,
      },
      { name: 'chargeTime', type: 'float32' },
      { name: 'baseEnchantment', type: 'formid' },
      { name: 'wornRestrictions', type: 'formid' },
    ],
  },
  // Effects - Using common EFID schema
  EFID: EFID_EFFECTS_SCHEMA,
  // VMAD (Papyrus script data) - optional, variable binary
  VMAD: { type: 'unknown' },
});
