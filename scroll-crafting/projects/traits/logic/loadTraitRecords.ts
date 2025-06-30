import { loadRecordSet } from "../../../utils/loadRecordSet.js";
import { resolveOrderedRecords } from "../../../utils/resolveOrderedRecords.js";
import { findByFormId } from "../../../utils/findByFormId.js";
import { SpelRecordFromSchema } from "../../../types/spelSchema.js";
import { FlstRecordFromSchema } from "../../../types/flstSchema.js";
import { MgefRecordFromSchema } from "../../../types/mgefSchema.js";
import { dirname, join, resolve } from "path";
import { fileURLToPath } from "url";
import { TraitRecordSet } from "../types.js";

const TRAITS_FORMLIST_EDID = "Traits_AbilityList";
const TRAIT_EDID_PREFIX = "LoreTraits_";
const TRAIT_EDID_SUFFIX = "Ab";

// Helper traits that should be excluded
const EXCLUDED_TRAITS = [
  "ScalingEffect",
  "Neg1",
  "ShowMenu",
  "Slot1",
  "Slot2",
  "Slot3",
  "Slot4",
  "NormalCrabBuff",
  "SuperCrabBuff"
];

// ESM-compatible __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Checks if a trait should be included in the output.
 * Excludes helper traits and traits without descriptions.
 */
function shouldIncludeTrait(spell: SpelRecordFromSchema): boolean {
  // Must have data and EDID
  if (!spell.data?.EDID) return false;

  // Must have a description
  if (!spell.data.DESC) return false;

  // Check against excluded patterns
  return !EXCLUDED_TRAITS.some(pattern => spell.data.EDID.includes(pattern));
}

/**
 * Creates a function to look up MGEF records by FormID
 */
function createMgefLookup(mgefRecords: MgefRecordFromSchema[]) {
  // Create a map for faster lookups
  const mgefMap = new Map(
    mgefRecords.map(record => [record.meta.globalFormId, record])
  );

  return (formId: string): MgefRecordFromSchema => {
    const record = mgefMap.get(formId);
    if (!record) {
      throw new Error(`Could not find MGEF record with ID ${formId}`);
    }
    return record;
  };
}

/**
 * Loads all trait-related records from both:
 * 1. The traits form list (core traits explicitly listed)
 * 2. Any spells with EDID pattern LoreTraits_*Ab (additional traits)
 */
export async function loadTraitRecords(): Promise<TraitRecordSet> {
  // Set up path for record loading
  const primariesDir = resolve(__dirname, "../../../primaries");

  // Load all required record sets
  const formListRecords = await loadRecordSet<FlstRecordFromSchema>("flst", primariesDir, primariesDir);
  const spellRecords = await loadRecordSet<SpelRecordFromSchema>("spel", primariesDir, primariesDir);
  const mgefRecords = await loadRecordSet<MgefRecordFromSchema>("mgef", primariesDir, primariesDir);

  // Create MGEF lookup function
  const getMgef = createMgefLookup(mgefRecords);

  // 1. Get traits from form list by EDID
  const traitsList = formListRecords.find(record => record.data?.EDID === TRAITS_FORMLIST_EDID);
  if (!traitsList) {
    throw new Error(`Could not find traits form list with EDID ${TRAITS_FORMLIST_EDID}`);
  }

  // Get all valid spells from the form list
  const formListTraits = resolveOrderedRecords(
    traitsList,
    spellRecords.filter(shouldIncludeTrait),
    findByFormId
  );

  // 2. Get additional traits by EDID pattern (from any plugin)
  const edidTraits = spellRecords.filter(spell => {
    if (!shouldIncludeTrait(spell)) return false;
    return spell.data.EDID.startsWith(TRAIT_EDID_PREFIX) &&
           spell.data.EDID.endsWith(TRAIT_EDID_SUFFIX);
  });

  // Merge, sort, and deduplicate traits
  const allTraits = [...formListTraits, ...edidTraits]
    .sort((a, b) => {
      const aName = a.data?.FULL || a.data?.EDID || "";
      const bName = b.data?.FULL || b.data?.EDID || "";
      return aName.localeCompare(bName);
    });

  // Deduplicate by FormID
  const uniqueTraits = Array.from(
    new Map(allTraits.map(trait => [trait.meta.globalFormId, trait])).values()
  );

  console.log(`Found ${formListTraits.length} traits from form list`);
  console.log(`Found ${edidTraits.length} traits from EDID pattern`);
  console.log(`Total unique traits after deduplication: ${uniqueTraits.length}`);

  return {
    spells: uniqueTraits,
    effects: mgefRecords,
    perks: [], // We'll load perks later if needed
    getMgef
  };
} 