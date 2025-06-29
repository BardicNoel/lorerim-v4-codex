import { SpelRecordFromSchema } from "../../../types/spelSchema.js";
import { TraitDefinition } from "../types.js";

/**
 * Formats bracketed values in descriptions with bold and italics.
 * Converts <value> to ***value***
 */
function formatBracketedValues(description: string): string {
  return description.replace(/<([^>]+)>/g, '***$1***');
}

/**
 * Resolves a trait from a SPEL record, extracting just the name and description.
 */
export function resolveTrait(
  spell: SpelRecordFromSchema
): TraitDefinition {
  if (!spell.data) {
    throw new Error(`Spell record ${spell.meta.globalFormId} has no data`);
  }

  return {
    name: spell.data.FULL || spell.data.EDID || "",
    description: formatBracketedValues(spell.data.DESC || ""),
    edid: spell.data.EDID || "",
    formId: spell.meta.globalFormId
  };
}

/**
 * Resolves an array of trait spells into trait definitions.
 * The spells passed in should already be filtered, merged, and deduplicated
 * (from the traits formlist and EDID pattern matching).
 */
export function resolveTraits(
  traitSpells: SpelRecordFromSchema[]
): TraitDefinition[] {
  return traitSpells
    .map(resolveTrait)
    .sort((a, b) => a.name.localeCompare(b.name));
} 