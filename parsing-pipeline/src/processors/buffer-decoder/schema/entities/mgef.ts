import { flagParserGenerator, mapParserGenerator } from '../generics';
import { RecordSpecificSchemas } from '../schemaTypes';
import { createSchema } from '../createSchema';
import { actorValueMap } from '../actorValueMapRecord';
import { CTDA_ARRAY_SCHEMA } from '../ctda/ctdaSchema';

// Effect Type mapping
export const MGEF_EFFECT_TYPES = {
  0: 'Value Modifier',
  1: 'Script',
  2: 'Dispel',
  3: 'Cure Disease',
  4: 'Absorb',
  5: 'Dual Value Modifier',
  6: 'Calm',
  7: 'Demoralize',
  8: 'Frenzy',
  9: 'Disarm',
  10: 'Command Summoned',
  11: 'Invisibility',
  12: 'Light',
  13: 'Lock',
  14: 'Open',
  15: 'Bound Weapon',
  16: 'Summon Creature',
  17: 'Detect Life',
  18: 'Telekinesis',
  19: 'Paralysis',
  20: 'Reanimate',
  21: 'Soul Trap',
  22: 'Turn Undead',
  23: 'Guide',
  24: 'Werewolf Feed',
  25: 'Cure Paralysis',
  26: 'Cure Addiction',
  27: 'Cure Poison',
  28: 'Concussion',
  29: 'Value And Parts',
  30: 'Accumulate Magnitude',
  31: 'Stagger',
  32: 'Peak Value Modifier',
  33: 'Cloak',
  34: 'Werewolf',
  35: 'Slow Time',
  36: 'Rally',
  37: 'Enhance Weapon',
  38: 'Spawn Hazard',
  39: 'Etherealize',
  40: 'Banish',
  41: 'Spawn Scripted Ref',
  42: 'Disguise',
  43: 'Grab Actor',
  44: 'Vampire Lord'
} as const;

// Cast Type mapping
export const MGEF_CAST_TYPES = {
  0: 'Constant Effect',
  1: 'Fire and Forget',
  2: 'Concentration'
} as const;

// Delivery Type mapping
export const MGEF_DELIVERY_TYPES = {
  0: 'Self',
  1: 'Contact',
  2: 'Aimed',
  3: 'Target Actor',
  4: 'Target Location'
} as const;

// Skill Type mapping for magic schools
export const MGEF_SKILL_TYPES = {
  [-1]: 'None',
  18: 'Alteration',
  19: 'Conjuration',
  20: 'Destruction',
  21: 'Illusion',
  22: 'Restoration'
} as const;

export const MGEFFlags: Record<number, string> = {
  0x00000001: 'Hostile',
  0x00000002: 'Recover',
  0x00000004: 'Detrimental',
  0x00000008: 'Snap to Navmesh',
  0x00000010: 'No Hit Event',
  0x00000100: 'Dispel Effects',
  0x00000200: 'No Duration',
  0x00000400: 'No Magnitude',
  0x00000800: 'No Area',
  0x00001000: 'FX Persist',
  0x00004000: 'Gory Visual',
  0x00008000: 'Hide in UI',
  0x00020000: 'No Recast',
  0x00200000: 'Power Affects Magnitude',
  0x00400000: 'Power Affects Duration',
  0x04000000: 'Painless',
  0x08000000: 'No Hit Effect',
  0x10000000: 'No Death Dispel',
  0x40000000: '?',
  0x80000000: '?',
};

export const mgefSchema: RecordSpecificSchemas = createSchema('MGEF', {
  // Editor ID
  EDID: { type: 'string', encoding: 'utf8' },
  // VMAD (Papyrus script data) - optional, variable binary
  VMAD: { type: 'unknown' },
  // Full name - optional
  FULL: { type: 'string', encoding: 'utf8' },
  // Menu Display Object - optional
  MDOB: { type: 'formid' },
  // Keyword count - optional
  KSIZ: { type: 'uint32' },
  // Keywords - optional
  KWDA: { type: 'array', element: { type: 'formid' } },
  DATA: {
    type: 'struct',
    fields: [
      { name: 'flags', type: 'uint32', parser: flagParserGenerator(MGEFFlags) },
      { name: 'baseCost', type: 'float32' },
      { name: 'relatedID', type: 'formid' },
      { name: 'skill', type: 'int32', parser: (value: number) => MGEF_SKILL_TYPES[value as keyof typeof MGEF_SKILL_TYPES] || `Unknown(${value})` },
      { name: 'resistanceAV', type: 'uint32', parser: mapParserGenerator(actorValueMap) },
      { name: 'unknown1', type: 'uint32' },
      { name: 'castingLight', type: 'formid' },
      { name: 'taperWeight', type: 'float32' },
      { name: 'hitShader', type: 'formid' },
      { name: 'enchantShader', type: 'formid' },
      { name: 'skillLevel', type: 'uint32' },
      { name: 'area', type: 'uint32' },
      { name: 'castingTime', type: 'float32' },
      { name: 'taperCurve', type: 'float32' },
      { name: 'taperDuration', type: 'float32' },
      { name: 'secondAVWeight', type: 'float32' },
      { name: 'effectType', type: 'uint32', parser: (value: number) => MGEF_EFFECT_TYPES[value as keyof typeof MGEF_EFFECT_TYPES] || `Unknown(${value})` },
      { name: 'primaryAV', type: 'int32', parser: mapParserGenerator(actorValueMap) },
      { name: 'projectileID', type: 'formid' },
      { name: 'explosionID', type: 'formid' },
      { name: 'castType', type: 'uint32', parser: (value: number) => MGEF_CAST_TYPES[value as keyof typeof MGEF_CAST_TYPES] || `Unknown(${value})` },
      { name: 'deliveryType', type: 'uint32', parser: (value: number) => MGEF_DELIVERY_TYPES[value as keyof typeof MGEF_DELIVERY_TYPES] || `Unknown(${value})` },
      { name: 'secondAV', type: 'int32', parser: mapParserGenerator(actorValueMap) },
      { name: 'castingArt', type: 'formid' },
      { name: 'hitEffectArt', type: 'formid' },
      { name: 'impactDataID', type: 'formid' },
      { name: 'skillUsageMult', type: 'float32' },
      { name: 'dualCastID', type: 'formid' },
      { name: 'dualCastScale', type: 'float32' },
      { name: 'enchantArtID', type: 'formid' },
      { name: 'nullData1', type: 'uint32' },
      { name: 'nullData2', type: 'uint32' },
      { name: 'equipAbility', type: 'formid' },
      { name: 'imageSpaceModID', type: 'formid' },
      { name: 'perkID', type: 'formid' },
      { name: 'soundVolume', type: 'uint32' },
      { name: 'scriptAIDataScore', type: 'float32' },
      { name: 'scriptAIDataDelayTime', type: 'float32' },
    ],
  },
  // Counter Effects - optional
  ESCE: { type: 'formid' },
  // Sound Data - optional, variable binary
  SNDD: { type: 'unknown' },
  // Description - optional
  DNAM: { type: 'string', encoding: 'utf8' },
  // Conditions (array of CTDA)
  CTDA: CTDA_ARRAY_SCHEMA,
});
