// Shared helpers for markdown rendering, record resolution, etc. (to be implemented)

export * from "./findByFormId.js";
export * from "./loadRecordSet.js";
export * from "./renderMarkdownTemplate.js";
export * from "./enrichedRecords/resolveEnrichedSpel.js";
export * from "./resolveOrderedRecords.js";
export * from "./formIdResolver.js";

// New reusable utilities for pattern recognition and classification
export * from "./patternRecognition.js";
export * from "./classification.js";

// Weapon keyword resolution utilities
export * from "./weaponKeywordResolver.js";

import { MgefRecordFromSchema } from "../types/mgefSchema.js";
import { SpelRecordFromSchema } from "../types/spelSchema.js";

/**
 * Given a SPEL record and an array of MGEF records, returns all related MGEF records
 * by connecting the spell's effects (decodedData.effects or decodedData.Effects)
 * with findByFormId on the MGEF records array.
 */
export function getMgefRecordsForSpell(
  spelRecord: SpelRecordFromSchema,
  mgefRecords: MgefRecordFromSchema[],
  findByFormId: (
    records: MgefRecordFromSchema[],
    formId: string
  ) => MgefRecordFromSchema | undefined
): MgefRecordFromSchema[] {
  const effects = spelRecord.data.effects;
  if (!Array.isArray(effects)) return [];
  const mgefFormIds = effects
    .map((effect) => effect.EFID)
    .filter((id): id is string => typeof id === "string");
  return mgefFormIds
    .map((formId) => findByFormId(mgefRecords, formId))
    .filter((mgef): mgef is MgefRecordFromSchema => mgef !== undefined);
}
