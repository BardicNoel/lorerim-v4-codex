import { z } from "zod";
import { PrimaryRecordSchema } from "./recordSchema.js";

// KYWD CNAM field schema - Color data (RGB format)
const KywdCnamFieldSchema = z.object({
  red: z.number(),
  green: z.number(),
  blue: z.number(),
});

// KYWD data field schema
export const KywdDataSchema = z.object({
  EDID: z.string(),
  CNAM: KywdCnamFieldSchema.optional(),
});

export const KywdRecordSchema = PrimaryRecordSchema.extend({
  data: KywdDataSchema,
});

export type KywdRecord = z.infer<typeof KywdRecordSchema>;
