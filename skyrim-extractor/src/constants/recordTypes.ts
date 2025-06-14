/**
 * Record types that should be processed by the extractor
 * These are the high-level record types we care about according to the design doc
 */
export const PROCESSED_RECORD_TYPES = new Set([
  'TES4',  // Master
  'GRUP',  // Group
  'PERK',  // Perks
  'AVIF',  // Actor Value Information
  'RACE',  // Races
  'SPEL',  // Spells
  'MGEF'   // Magic Effects
] as const);

export type ProcessedRecordType = typeof PROCESSED_RECORD_TYPES extends Set<infer T> ? T : never; 