import { z } from "zod";
import { PrimaryRecordSchema } from "../types/recordSchema.js";
import { FlstRecordSchema } from "../types/flstSchema.js";
import { findByFormId } from "./findByFormId.js";

/**
 * Resolves an ordered list of records from a FLST's LNAM array.
 * @param flstRecord The FLST record containing the ordered FormIDs
 * @param targetRecords Array of target records to search through
 * @param findByFormId Utility for cross-record lookup
 * @returns Array of records in the order specified by the FLST's LNAM array
 */
export function resolveOrderedRecords<T extends z.infer<typeof PrimaryRecordSchema>>(
  flstRecord: z.infer<typeof FlstRecordSchema>,
  targetRecords: T[],
  findByFormId: <R extends { meta?: { globalFormId?: string } }>(
    records: R[],
    formId: string
  ) => R | null
): T[] {
  // Validate that the FLST record has the expected structure
  if (!flstRecord.data?.LNAM || !Array.isArray(flstRecord.data.LNAM)) {
    console.log("❌ resolveOrderedRecords: No LNAM data found or not an array");
    return [];
  }

  console.log(`🔍 resolveOrderedRecords: Resolving ${flstRecord.data.LNAM.length} records from FLST ${flstRecord.data.EDID}`);

  const resolved: T[] = [];
  const notFound: string[] = [];

  // Process each FormID in order
  for (const formId of flstRecord.data.LNAM) {
    const record = findByFormId(targetRecords, formId);
    if (record) {
      resolved.push(record as T);
      console.log(`   ✅ Found record for FormID ${formId}: ${(record as any).data?.EDID || 'No EDID'}`);
    } else {
      notFound.push(formId);
      console.log(`   ❌ Could not find record for FormID: ${formId}`);
    }
  }

  if (notFound.length > 0) {
    console.log(`   ⚠️  ${notFound.length} FormIDs not found: ${notFound.join(', ')}`);
  }

  console.log(`   📊 Resolved ${resolved.length} out of ${flstRecord.data.LNAM.length} records`);
  return resolved;
}

/**
 * Type-safe version that ensures the target records match the expected schema
 */
export function resolveOrderedRecordsTyped<T extends z.infer<typeof PrimaryRecordSchema>>(
  flstRecord: z.infer<typeof FlstRecordSchema>,
  targetRecords: T[],
  findByFormId: <R extends { meta?: { globalFormId?: string } }>(
    records: R[],
    formId: string
  ) => R | null,
  schema: z.ZodSchema<T>
): T[] {
  const resolved = resolveOrderedRecords(flstRecord, targetRecords, findByFormId);
  
  // Validate each resolved record against the schema
  const validated: T[] = [];
  for (const record of resolved) {
    try {
      const validatedRecord = schema.parse(record);
      validated.push(validatedRecord);
    } catch (error) {
      console.log(`   ⚠️  Record validation failed for ${(record as any).data?.EDID}: ${error}`);
    }
  }
  
  return validated;
} 