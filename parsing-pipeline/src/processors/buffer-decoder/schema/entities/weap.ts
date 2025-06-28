import { createSchema } from '../createSchema';
import { flagParserGenerator } from '../generics';
import { RecordSpecificSchemas } from '../schemaTypes';

// First set of flags in DNAM
export const WeaponFlags1: Record<number, string> = {
  0x01: 'Ignores Normal Weapon Resistance',
  0x02: 'Automatic',
  0x04: 'Has Scope',
  0x08: "Can't Drop",
  0x10: 'Hide Backpack',
  0x20: 'Embedded Weapon',
  0x40: "Don't Use 1st Person IS Animations",
  0x80: 'Unplayable',
};

// Second set of flags in DNAM
export const WeaponFlags2: Record<number, string> = {
  0x01: 'Player Only',
  0x02: 'NPCs Use Ammo',
  0x04: 'No Jam After Reload',
  0x10: 'Minor Crime',
  0x20: 'Fixed Range',
  0x40: 'Not Used in Normal Combat',
  0x80: "Don't Use 3rd Person IS Animations",
};

// Animation type lookup
export const WeaponAnimType: Record<number, string> = {
  0: 'Other',
  1: 'OneHandSword',
  2: 'OneHandDagger',
  3: 'OneHandAxe',
  4: 'OneHandMace',
  5: 'TwoHandSword',
  6: 'TwoHandAxe',
  7: 'Bow',
  8: 'Staff',
  9: 'Crossbow',
};

// Sound level lookup
export const SoundLevel: Record<number, string> = {
  0: 'Loud',
  1: 'Normal',
  2: 'Silent',
  3: 'Very Loud',
};

// Critical flags
export const CriticalFlags: Record<number, string> = {
  0x01: 'On Death',
};

export const weapSchema: RecordSpecificSchemas = createSchema('WEAP', {
  // Common fields are automatically included by createSchema

  // Model data
  MODL: { type: 'string', encoding: 'utf8' },
  MODT: { type: 'unknown' },
  MODS: { type: 'unknown' }, // Alternate textures

  // Template
  CNAM: { type: 'formid' }, // Template weapon

  // Weapon data
  DATA: {
    type: 'struct',
    fields: [
      { name: 'value', type: 'int32' },
      { name: 'weight', type: 'float32' },
      { name: 'damage', type: 'uint16' },
    ],
  },

  DNAM: {
    type: 'struct',
    fields: [
      { name: 'animationType', type: 'uint8', parser: flagParserGenerator(WeaponAnimType) },
      { name: 'attackAnimation', type: 'uint8' },
      { name: 'numProjectiles', type: 'uint8' },
      { name: 'embeddedWeaponAV', type: 'uint8' },
      { name: 'speed', type: 'float32' },
      { name: 'reach', type: 'float32' },
      { name: 'flags1', type: 'uint8', parser: flagParserGenerator(WeaponFlags1) },
      { name: 'flags2', type: 'uint8', parser: flagParserGenerator(WeaponFlags2) },
      { name: 'padding1', type: 'uint8' },
      { name: 'padding2', type: 'uint8' },
      { name: 'sightFOV', type: 'float32' },
      { name: 'baseVATSToHitChance', type: 'uint8' },
      { name: 'attackDelay', type: 'uint8' },
      { name: 'padding3', type: 'uint8' },
      { name: 'padding4', type: 'uint8' },
      { name: 'minRange', type: 'float32' },
      { name: 'maxRange', type: 'float32' },
      { name: 'onHit', type: 'uint32' },
      { name: 'rumbleLeftMotor', type: 'float32' },
      { name: 'rumbleRightMotor', type: 'float32' },
      { name: 'rumbleDuration', type: 'float32' },
      { name: 'skill', type: 'int32' },
      { name: 'resist', type: 'int32' },
      { name: 'stagger', type: 'float32' },
    ],
  },

  // Critical data
  CRDT: {
    type: 'struct',
    fields: [
      { name: 'criticalDamage', type: 'uint16' },
      { name: 'unused1', type: 'uint16' },
      { name: 'criticalPercent', type: 'float32' },
      { name: 'flags', type: 'uint8', parser: flagParserGenerator(CriticalFlags) },
      { name: 'padding1', type: 'uint8' },
      { name: 'padding2', type: 'uint8' },
      { name: 'padding3', type: 'uint8' },
      { name: 'criticalEffect', type: 'formid' },
    ],
  },

  // Enchantment
  EAMT: { type: 'uint16' }, // Enchantment charge amount
  EITM: { type: 'formid' }, // Enchantment

  // Equipment type
  ETYP: { type: 'formid' }, // Points to EQUP record

  // Impact data
  BAMT: { type: 'formid' }, // Alternate block material
  BIDS: { type: 'formid' }, // Block bash impact data set
  INAM: { type: 'formid' }, // Impact data set

  // Sounds
  NAM7: { type: 'formid' }, // Attack loop sound
  NAM8: { type: 'formid' }, // Unequip sound
  NAM9: { type: 'formid' }, // Equip sound
  SNAM: { type: 'formid' }, // Attack sound
  TNAM: { type: 'formid' }, // Attack fail sound
  UNAM: { type: 'formid' }, // Idle sound
  XNAM: { type: 'formid' }, // Attack sound 2D
  YNAM: { type: 'formid' }, // Pickup sound
  ZNAM: { type: 'formid' }, // Putdown sound

  // Other
  NNAM: { type: 'string', encoding: 'utf8' }, // Embedded weapon node
  VNAM: { type: 'uint32', parser: flagParserGenerator(SoundLevel) }, // Sound level
  WNAM: { type: 'formid' }, // 1st person model
  VMAD: { type: 'unknown' }, // Script data
});

export default weapSchema;
