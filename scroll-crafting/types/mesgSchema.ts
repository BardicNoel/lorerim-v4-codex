import { z } from "zod";
import { PrimaryRecordSchema } from "./recordSchema.js";

// Shape for the main data field of MESG
export const MesgDataSchema = z.object({
  EDID: z.string(),
  DESC: z.string().optional(),
  FULL: z.string().optional(),
});

// MESG record schema extending PrimaryRecordSchema
export const MesgRecordSchema = PrimaryRecordSchema.extend({
  data: MesgDataSchema,
});

export type MesgRecordFromSchema = z.infer<typeof MesgRecordSchema>;
