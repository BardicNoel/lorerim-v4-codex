import { z } from "zod";
import { PrimaryRecordSchema } from "./recordSchema.js";

// Shape for the DATA subfield inside MGEF data
const MgefDataFieldSchema = z.object({
  flags: z.array(z.string()),
  baseCost: z.number(),
  relatedID: z.string(),
  skill: z.number(),
  resistanceAV: z.string().nullable(),
  skillLevel: z.number(),
  effectType: z.number(),
  primaryAV: z.string().nullable(),
  secondAV: z.number(),
  perkID: z.string(),
});

// Shape for the main data field of MGEF
export const MgefDataSchema = z.object({
  EDID: z.string(),
  FULL: z.string(),
  DATA: MgefDataFieldSchema,
  DNAM: z.string(),
});

// MGEF record schema extending PrimaryRecordSchema
export const MgefRecordSchema = PrimaryRecordSchema.extend({
  data: MgefDataSchema,
});

export type MgefRecordFromSchema = z.infer<typeof MgefRecordSchema>;
