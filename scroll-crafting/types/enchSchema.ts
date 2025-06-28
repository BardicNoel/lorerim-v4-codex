import { z } from "zod";
import { PrimaryRecordSchema } from "./recordSchema.js";

// Enchantment ENIT field schema
const EnchEnitFieldSchema = z.object({
  enchantmentCost: z.number(),
  flags: z.array(z.string()),
  castType: z.string(),
  enchAmount: z.number(),
  delivery: z.string(),
  enchantType: z.string(),
  chargeTime: z.number(),
  baseEnchantment: z.string(),
  wornRestrictions: z.string(),
});

// Enchantment effect schema
const EnchEffectSchema = z.object({
  EFID: z.string(), // Effect FormID
  EFIT: z.object({
    magnitude: z.number(),
    area: z.number(),
    duration: z.number(),
  }),
});

// Enchantment record schema
export const EnchDataSchema = z.object({
  EDID: z.string(),
  FULL: z.string(),
  ENIT: EnchEnitFieldSchema,
  effects: z.array(EnchEffectSchema),
});

export const EnchRecordSchema = PrimaryRecordSchema.extend({
  data: EnchDataSchema,
});

export type EnchRecord = z.infer<typeof EnchRecordSchema>;

// Schema validation helper function
export function validateEnchRecord(data: any): EnchRecord {
  return EnchRecordSchema.parse(data);
}
