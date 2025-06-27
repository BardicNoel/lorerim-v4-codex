import { z } from "zod";
import { PrimaryRecordSchema } from "./recordSchema.js";

// Shape for the SPIT subfield inside SPEL data
const SpelSpitSchema = z.object({
  spellCost: z.number(),
  flags: z.array(z.string()),
  type: z.string(),
  chargeTime: z.number(),
  castType: z.string(),
  delivery: z.string(),
  castDuration: z.number(),
  range: z.number(),
  halfCostPerk: z.string(),
});

// Shape for the effects array inside SPEL data
const SpelEffectSchema = z.object({
  EFID: z.string(),
  EFIT: z.object({
    magnitude: z.number(),
    area: z.number(),
    duration: z.number(),
  }),
});

// Shape for the main data field of SPEL
export const SpelDataSchema = z.object({
  EDID: z.string(),
  FULL: z.string(),
  ETYP: z.string(),
  DESC: z.string(),
  SPIT: SpelSpitSchema,
  effects: z.array(SpelEffectSchema),
});

// SPEL record schema extending PrimaryRecordSchema
export const SpelRecordSchema = PrimaryRecordSchema.extend({
  data: SpelDataSchema,
});

export type SpelRecordFromSchema = z.infer<typeof SpelRecordSchema>;
