// Shared helpers for markdown rendering, record resolution, etc. (to be implemented)

export { loadRecordSet } from "./loadRecordSet.js";
export { renderMarkdownTemplate } from "./renderMarkdownTemplate.js";
export { findByFormId } from "./findByFormId.js";

/**
 * Given a SPEL record and an array of MGEF records, returns all related MGEF records
 * by connecting the spell's effects (decodedData.effects or decodedData.Effects)
 * with findByFormId on the MGEF records array.
 */
export function getMgefRecordsForSpell(
  spelRecord: any,
  mgefRecords: any[],
  findByFormId: (records: any[], formId: string) => any
): any[] {
  const effects =
    spelRecord?.decodedData?.effects || spelRecord?.decodedData?.Effects;
  if (!Array.isArray(effects)) return [];
  const mgefFormIds = effects
    .map((effect: any) => effect?.EFID)
    .filter((id: string | undefined) => typeof id === "string");
  return mgefFormIds
    .map((formId) => findByFormId(mgefRecords, formId))
    .filter(Boolean);
}
