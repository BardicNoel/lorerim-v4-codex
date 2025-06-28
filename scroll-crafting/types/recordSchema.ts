import { z } from "zod";

// Zod schema for ParsedRecord.meta
const ParsedRecordMetaSchema = z.object({
  isWinner: z.boolean().optional(),
  type: z.string(),
  formId: z.string(),
  globalFormId: z.string(),
  stackOrder: z.number().nullable().optional(),
  plugin: z.string(),
});

// Zod schema for ParsedRecord.record (array of { tag, buffer })
const ParsedRecordRecordSchema = z.object({
  tag: z.string(),
  buffer: z.string(),
});

// Zod schema for ParsedRecord
export const ParsedRecordSchema = z.object({
  meta: ParsedRecordMetaSchema,
  record: z.array(ParsedRecordRecordSchema),
  decodedData: z.record(z.any()).optional(),
  decodedErrors: z.record(z.any()).optional(),
  header: z.string(),
});

export type ParsedRecordFromSchema = z.infer<typeof ParsedRecordSchema>;

// PrimaryRecordSchema: locked-down version for type-specific records
export const PrimaryRecordSchema = z.object({
  meta: ParsedRecordMetaSchema,
  data: z.any(), // To be replaced/extended with type-specific schemas
});

export type PrimaryRecordFromSchema = z.infer<typeof PrimaryRecordSchema>;
