import { z } from "zod";
import { PrimaryRecordSchema } from "./recordSchema.js";

// Weapon data field schema
const WeaponDataFieldSchema = z.object({
  value: z.number(),
  weight: z.number(),
  damage: z.number(),
});

// Weapon DNAM field schema
const WeaponDnamFieldSchema = z.object({
  animationType: z.number(),
  speed: z.number(),
  reach: z.number(),
  flags1: z.array(z.string()),
  flags2: z.array(z.string()),
});

// Weapon record schema
export const WeaponDataSchema = z.object({
  EDID: z.string(),
  FULL: z.string(),
  DATA: WeaponDataFieldSchema,
  DNAM: WeaponDnamFieldSchema,
  EITM: z.string().optional(), // Enchantment FormID
  EAMT: z.number().optional(), // Enchantment charge amount
});

export const WeaponRecordSchema = PrimaryRecordSchema.extend({
  data: WeaponDataSchema,
});

export type WeaponRecord = z.infer<typeof WeaponRecordSchema>;

// Enchantment ENIT field schema
const EnchantmentEnitFieldSchema = z.object({
  enchantmentCost: z.number(),
  flags: z.array(z.string()),
  castType: z.number(),
  chargeAmount: z.number(),
  enchantmentAmount: z.number(),
  enchantmentType: z.number(),
  chargeTime: z.number(),
  baseEnchantment: z.string(),
  wornRestrictions: z.string(),
});

// Enchantment EFIT field schema
const EnchantmentEfitFieldSchema = z.object({
  magnitude: z.number(),
  area: z.number(),
  duration: z.number(),
});

// Enchantment record schema
export const EnchantmentDataSchema = z.object({
  EDID: z.string(),
  FULL: z.string(),
  ENIT: EnchantmentEnitFieldSchema,
  EFID: z.string(), // Effect FormID
  EFIT: EnchantmentEfitFieldSchema,
});

export const EnchantmentRecordSchema = PrimaryRecordSchema.extend({
  data: EnchantmentDataSchema,
});

export type EnchantmentRecord = z.infer<typeof EnchantmentRecordSchema>;

// Weapon categories mapping
export const WeaponCategories: Record<number, string> = {
  1: "One-Handed Swords",
  2: "One-Handed Daggers",
  3: "One-Handed Axes",
  4: "One-Handed Maces",
  5: "Two-Handed Swords",
  6: "Two-Handed Axes",
  7: "Bows",
  8: "Staves",
  9: "Crossbows",
};
