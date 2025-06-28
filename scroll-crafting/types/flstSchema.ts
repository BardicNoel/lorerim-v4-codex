import { z } from "zod";
import { PrimaryRecordSchema } from "./recordSchema.js";

// Shape for the main data field of FLST
export const FlstDataSchema = z.object({
  EDID: z.string(),
  LNAM: z.array(z.string()), // Array of FormIDs
});

// FLST record schema extending PrimaryRecordSchema
export const FlstRecordSchema = PrimaryRecordSchema.extend({
  data: FlstDataSchema,
});

export type FlstRecordFromSchema = z.infer<typeof FlstRecordSchema>;
