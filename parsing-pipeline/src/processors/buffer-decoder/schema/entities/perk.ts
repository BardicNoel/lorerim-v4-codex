import { RecordSpecificSchemas, FieldSchema } from '../schemaTypes';
import { createSchema } from '../createSchema';
import { CTDA_ARRAY_SCHEMA } from '../ctda/ctdaSchema';

// PERK DATA flags (main perk flags)
export const PERK_DATA_FLAGS = {
  0x00000001: 'IsTrait',
  0x00000002: 'Level',
  0x00000004: 'NumRanks',
  0x00000008: 'IsPlayable',
  0x00000010: 'IsHidden',
} as const;

// PERK section types
export const PERK_SECTION_TYPES = {
  0: 'Quest Section',
  1: 'Ability Section',
  2: 'Complex Entry Point Section',
} as const;

// PERK condition types (PRKC)
export const PERK_CONDITION_TYPES = {
  0: 'Perk Owner',
  1: 'Target',
  2: 'Attacker',
  3: 'Attacker Weapon',
  4: 'Spell',
  5: 'Weapon',
  6: 'Item',
  7: 'Enchantment',
  8: 'Locked Reference',
} as const;

// PERK effect types (from UESP documentation)
export const PERK_EFFECT_TYPES = {
  0x00: 'Calculate Weapon Damage',
  0x01: 'Calculate My Critical Hit Chance',
  0x02: 'Calculate My Critical Hit Damage',
  0x03: 'Calculate Mine Explode Chance',
  0x04: 'Adjust Limb Damage',
  0x05: 'Adjust Book Skill Points 1',
  0x06: 'Mod Recovered Health',
  0x07: 'Get Should Attack',
  0x08: 'Mod Buy Prices',
  0x09: 'Add Level List On Death',
  0x0a: 'Get Max Carry Weight',
  0x0b: 'Mod Addiction Chance',
  0x0c: 'Mod Positive Chem Duration',
  0x0d: 'Mod Positive Chem Duration',
  0x0e: 'Activate',
  0x0f: 'Ignore Running During Detection',
  0x10: 'Ignore Broken Lock',
  0x11: 'Mod Enemy Critical Hit Chance',
  0x12: 'Mod Sneak Attack Multiplier',
  0x13: 'Mod Max Placeable Mines',
  0x14: 'Mod Bow Zoom',
  0x15: 'Mod Recover Arrow Chance',
  0x16: 'Mod Skill Use',
  0x17: 'Mod Telekinesis Distance',
  0x18: 'Mod Telekinesis Damage Multiplier',
  0x19: 'Mod Telekinesis Damage',
  0x1a: 'Mod Bashing Damage',
  0x1b: 'Mod Power Attack Stamina',
  0x1c: 'Mod Power Attack Damage',
  0x1d: 'Mod Spell Magnitude',
  0x1e: 'Mod Spell Duration',
  0x1f: 'Mod Secondary Value Weight',
  0x20: 'Mod Armor Weight',
  0x21: 'Mod Incoming Stagger',
  0x22: 'Mod Target Stagger',
  0x23: 'Mod Attack Damage',
  0x24: 'Mod Incoming Damage',
  0x25: 'Mod Target Damage Resistance',
  0x26: 'Mod Spell Cost',
  0x27: 'Mod Percent Blocked',
  0x28: 'Mod Shield Deflect Arrow Chance',
  0x29: 'Mod Incoming Spell Magnitude',
  0x2a: 'Mod Incoming Spell Duration',
  0x2b: 'Mod Player Intimidation',
  0x2c: 'Mod Player Reputation',
  0x2d: 'Mod Favor Points',
  0x2e: 'Mod Bribe Amount',
  0x2f: 'Mod Detection Light',
  0x30: 'Mod Detection Movement',
  0x31: 'Mod Soul Gem Recharge',
  0x32: 'Set Sweep Attack',
  0x33: 'Apply Combat Hit Spell',
  0x34: 'Apply Bashing Spell',
  0x35: 'Apply Reanimate Spell',
  0x36: 'Set Boolean Graph Variable',
  0x37: 'Mod Spell Casting Sound Event',
  0x38: 'Mod Pickpocket Chance',
  0x39: 'Mod Detection Sneak Skill',
  0x3a: 'Mod Falling Damage',
  0x3b: 'Mod Lockpick Sweet Spot',
  0x3c: 'Mod Sell Prices',
  0x3d: 'Can Pickpocket Equipped Item',
  0x3e: 'Mod Lockpick Level Allowed',
  0x3f: 'Set Lockpick Start Position',
  0x40: 'Set Progression Picking',
  0x41: 'Make Lockpicks Unbreakable',
  0x42: 'Mod Alchemy Effectiveness',
  0x43: 'Apply Weapon Swing Spell',
  0x44: 'Mod Commanded Actor Limit',
  0x45: 'Apply Sneaking Spell',
  0x46: 'Mod Player Magic Slowdown',
  0x47: 'Mod Ward Magic Absorption Percent',
  0x48: 'Mod Ingredient Effects Learned',
  0x49: 'Purify Alchemy Ingredients',
  0x4a: 'Filter Activation',
  0x4b: 'Can Dual Cast Spell',
  0x4c: 'Mod Tempering Health',
  0x4d: 'Mod Enchantment Power',
  0x4e: 'Mod Soul Percent Captured to Weapon',
  0x4f: 'Mod Soul Gem Enchanting',
  0x50: 'Mod Number of Enchantments Allowed',
  0x51: 'Set Activate Label',
  0x52: 'Mod Shout OK',
  0x53: 'Mod Poison Dose Count',
  0x54: 'Should Apply Placed Item',
  0x55: 'Mod Armor Rating',
  0x56: 'Mod Lockpick Crime Chance',
  0x57: 'Mod Telekinesis Damage',
  0x58: 'Mod Spell Range to Location',
  0x59: 'Mod Potions Created',
  0x5a: 'Mod Lockpick Key Reward Chance',
} as const;

// PERK function types (from UESP documentation)
export const PERK_FUNCTION_TYPES = {
  0x01: 'Set Value',
  0x02: 'Add Value',
  0x03: 'Multiply Value',
  0x04: 'Add Range to Value',
  0x05: 'Add Actor Value Mult',
  0x06: 'Absolute',
  0x07: 'Negative ABS Value',
  0x08: 'Add Level List',
  0x09: 'Add Activate Choice',
  0x0a: 'Select Spell',
  0x0b: 'Select Text',
  0x0c: 'Set to Actor Value Mult',
  0x0d: 'Multiply Actor Value',
  0x0e: 'Multiply 1 + Actor Value',
  0x0f: 'Set Text',
} as const;

// PERK entry point data types (EPFT)
export const PERK_ENTRY_POINT_DATA_TYPES = {
  0x01: 'Float',
  0x02: 'Float AV + Float Factor',
  0x03: 'FormID',
  0x04: 'LString Verb + DWord + FormID',
  0x05: 'FormID (SPEL)',
  0x06: 'ZString (GMST editorid)',
  0x07: 'LString (verb for custom activate actions)',
} as const;

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
    parser: (value: number) =>
      PERK_CONDITION_TYPES[value as keyof typeof PERK_CONDITION_TYPES] || `Unknown(${value})`,
  },
  CTDA: CTDA_ARRAY_SCHEMA,
};

const abilitySectionSchema: { [tag: string]: FieldSchema } = {
  ...perkConditionalSchema,
  DATA: {
    type: 'struct' as const,
    fields: [{ name: 'spellId', type: 'formid' as const }],
  },
  CTDA: CTDA_ARRAY_SCHEMA,
  PRKF: {
    type: 'unknown' as const, // Just a marker, no data
  },
  CIS2: { type: 'unknown' },
};

const complexSectionSchema: { [tag: string]: FieldSchema } = {
  DATA: {
    type: 'struct' as const,
    fields: [
      {
        name: 'effectType',
        type: 'uint8' as const,
        parser: (value: number) =>
          PERK_EFFECT_TYPES[value as keyof typeof PERK_EFFECT_TYPES] || `Unknown(${value})`,
      },
      {
        name: 'functionType',
        type: 'uint8' as const,
        parser: (value: number) =>
          PERK_FUNCTION_TYPES[value as keyof typeof PERK_FUNCTION_TYPES] || `Unknown(${value})`,
      },
      { name: 'conditionCount', type: 'uint8' as const },
    ],
  },
  // Condition subsections - these will be processed as individual fields
  PRKC: {
    type: 'uint8' as const,
    parser: (value: number) =>
      PERK_CONDITION_TYPES[value as keyof typeof PERK_CONDITION_TYPES] || `Unknown(${value})`,
  },
  CTDA: CTDA_ARRAY_SCHEMA,
  EPFT: {
    type: 'uint8' as const,
    parser: (value: number) =>
      PERK_ENTRY_POINT_DATA_TYPES[value as keyof typeof PERK_ENTRY_POINT_DATA_TYPES] ||
      `Unknown(${value})`,
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
  // Using the new comprehensive CTDA schema
  CTDA: CTDA_ARRAY_SCHEMA,

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
        fields: [
          {
            name: 'sectionType',
            type: 'uint8' as const,
            parser: (value: number) =>
              PERK_SECTION_TYPES[value as keyof typeof PERK_SECTION_TYPES] || `Unknown(${value})`,
          },
          { name: 'rank', type: 'uint8' as const },
          { name: 'priority', type: 'uint8' as const },
        ],
      },
    },
    dynamicSchema: (parsedPRKE: any) => {
      const sectionType = parsedPRKE.sectionType;

      // Handle both numeric and string section types
      let sectionTypeNum: number;
      if (typeof sectionType === 'string') {
        // Reverse lookup from string to number
        const entry = Object.entries(PERK_SECTION_TYPES).find(
          ([_, value]) => value === sectionType
        );
        sectionTypeNum = entry ? parseInt(entry[0]) : -1;
      } else {
        sectionTypeNum = sectionType;
      }

      switch (sectionTypeNum) {
        case 0: // Quest section
          return questSectionSchema;
        case 1: // Ability section
          return abilitySectionSchema;
        case 2: // Complex Entry Point section
          return complexSectionSchema;
        default:
          console.warn(`[WARN] Unknown section type: ${sectionType} (numeric: ${sectionTypeNum})`);
          return { PRKF: { type: 'unknown' } };
      }
    },
  },
});
