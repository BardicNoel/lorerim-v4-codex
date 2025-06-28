import { z } from "zod";
import { PrimaryRecordSchema } from "./recordSchema.js";

// Weapon data field schema
const WeapDataFieldSchema = z.object({
  value: z.number(),
  weight: z.number(),
  damage: z.number(),
});

// Weapon DNAM field schema - handle both string and array animationType
const WeapDnamFieldSchema = z.object({
  animationType: z.union([z.string(), z.array(z.string()), z.number()]),
  speed: z.number(),
  reach: z.number(),
  flags1: z.array(z.string()),
  flags2: z.array(z.string()),
  skill: z.number().optional(),
  resist: z.number().optional(),
  stagger: z.number().optional(),
});

// Weapon CRDT field schema
const WeapCrdtFieldSchema = z.object({
  criticalDamage: z.number(),
  criticalPercent: z.number(),
  flags: z.array(z.string()),
  criticalEffect: z.string(),
});

// Weapon record schema
export const WeapDataSchema = z.object({
  EDID: z.string(),
  FULL: z.string(),
  MODL: z.string(),
  EITM: z.string().optional(), // Enchantment FormID
  EAMT: z.number().optional(), // Enchantment charge amount
  ETYP: z.string(),
  KSIZ: z.number(),
  KWDA: z.array(z.string()),
  DESC: z.string(),
  DATA: WeapDataFieldSchema,
  DNAM: WeapDnamFieldSchema,
  CRDT: WeapCrdtFieldSchema,
  CNAM: z.string(),
});

export const WeapRecordSchema = PrimaryRecordSchema.extend({
  data: WeapDataSchema,
});

export type WeapRecord = z.infer<typeof WeapRecordSchema>;

// Weapon categories mapping - handle string-based animation types
export const WeapCategories: Record<string, string> = {
  Sword: "One-Handed Swords",
  Dagger: "One-Handed Daggers",
  Axe: "One-Handed Axes",
  Mace: "One-Handed Maces",
  Greatsword: "Two-Handed Swords",
  Battleaxe: "Two-Handed Axes",
  Warhammer: "Two-Handed Maces",
  Bow: "Bows",
  Staff: "Staves",
  Crossbow: "Crossbows",
  // Handle numeric codes as fallback
  "1": "One-Handed Swords",
  "2": "One-Handed Daggers",
  "3": "One-Handed Axes",
  "4": "One-Handed Maces",
  "5": "Two-Handed Swords",
  "6": "Two-Handed Axes",
  "7": "Bows",
  "8": "Staves",
  "9": "Crossbows",
};
