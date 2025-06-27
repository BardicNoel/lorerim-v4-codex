import { ParsedRecord } from "@lorerim/platform-types";

export interface Subclass {
  name: string;
  description?: string;
  prerequisites?: string[];
  // Add more fields as needed
}

/**
 * Resolves subclasses from the FLST record and perks dataset.
 * @param flstRecord The FLST ParsedRecord for DAR_DestinyFormList
 * @param perks Array of ParsedRecord for perks
 * @param findByFormId Utility for cross-record lookup
 * @returns Array of mapped Subclass objects
 */
export function resolveSubclasses(
  flstRecord: ParsedRecord,
  perks: ParsedRecord[],
  findByFormId: <T extends { meta?: { globalFormId?: string } }>(
    records: T[],
    formId: string
  ) => T | null
): Subclass[] {
  if (
    !flstRecord.decodedData?.LNAM ||
    !Array.isArray(flstRecord.decodedData.LNAM)
  ) {
    return [];
  }

  return flstRecord.decodedData.LNAM.map((formId: string) => {
    const perk = findByFormId(perks, formId);
    if (!perk || !perk.decodedData) return null;
    const name = perk.decodedData.FULL || perk.decodedData.EDID || "Unknown";
    const description = perk.decodedData.DNAM?.description || "";
    const prerequisites = Array.isArray(perk.decodedData.PRKE)
      ? perk.decodedData.PRKE
      : perk.decodedData.PRKE
        ? [perk.decodedData.PRKE]
        : undefined;
    return {
      name,
      description,
      prerequisites,
    };
  }).filter(Boolean) as Subclass[];
}
