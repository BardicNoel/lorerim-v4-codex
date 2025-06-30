import { z } from "zod";
import { PrimaryRecordSchema } from "./recordSchema.js";

// Effect Type mapping
const MGEF_EFFECT_TYPES = {
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
const MGEF_CAST_TYPES = {
  0: 'Constant Effect',
  1: 'Fire and Forget',
  2: 'Concentration'
} as const;

// Delivery Type mapping
const MGEF_DELIVERY_TYPES = {
  0: 'Self',
  1: 'Contact',
  2: 'Aimed',
  3: 'Target Actor',
  4: 'Target Location'
} as const;

// Skill Type mapping for magic schools
const MGEF_SKILL_TYPES = {
  [-1]: 'None',
  18: 'Alteration',
  19: 'Conjuration',
  20: 'Destruction',
  21: 'Illusion',
  22: 'Restoration'
} as const;

// Shape for the actor value field
const ActorValueSchema = z.object({
  name: z.string(),
  type: z.enum(['AI', 'Skill', 'Attribute', 'Status', 'Perk', 'Exp', 'Mult', 'Resist', 'Stat', 'Buffer', 'Toggle', 'Obsolete', 'User-defined', 'Mod']),
  effect: z.string(),
  formId: z.string()
}).nullable();

// Shape for the DATA subfield inside MGEF data
const MgefDataFieldSchema = z.object({
  flags: z.array(z.string()),
  baseCost: z.number(),
  relatedID: z.string(),
  skill: z.string(),
  resistanceAV: ActorValueSchema,
  skillLevel: z.number(),
  area: z.number(),
  castingTime: z.number(),
  effectType: z.string(),
  primaryAV: ActorValueSchema,
  castType: z.string(),
  deliveryType: z.string(),
  secondAV: ActorValueSchema,
  perkID: z.string()
});

// Shape for the main data field of MGEF
export const MgefDataSchema = z.object({
  EDID: z.string(),
  FULL: z.string(),
  MDOB: z.string().optional(),
  DATA: MgefDataFieldSchema,
  DNAM: z.string()
});

// MGEF record schema extending PrimaryRecordSchema
export const MgefRecordSchema = PrimaryRecordSchema.extend({
  data: MgefDataSchema,
});

export type MgefRecordFromSchema = z.infer<typeof MgefRecordSchema>;
