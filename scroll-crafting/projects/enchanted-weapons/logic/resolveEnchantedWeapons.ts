import { WeapRecord } from "../../../types/weapSchema.js";
import { EnchRecord } from "../../../types/enchSchema.js";
import { KywdRecord } from "../../../types/kywdSchema.js";
import { MgefRecordFromSchema } from "../../../types/mgefSchema.js";
import {
  getBestDisplayName,
  isVendorItem,
  getWeaponMaterial,
  WeaponTypeKeywords,
} from "../../../utils/weaponKeywordResolver.js";
import { formIdResolver } from "../../../utils/formIdResolver.js";
import {
  separateUniqueAndGeneralWeapons,
  UniqueWeapon,
  GeneralWeaponTemplate,
  GeneralWeaponEnchantment,
} from "./weaponClassification.js";
import {
  EnchantedWeapon,
  BoundMysticWeapon,
  WandStaffWeapon,
} from "./types.js";
import { determineWeaponType } from "./weaponTypeDetection.js";
import { resolveWeaponKeywordsAndMetadata } from "./weaponMetadata.js";
import {
  isBoundMysticWeapon,
  convertToBoundMysticWeapon,
  isWandOrStaff,
  convertToWandStaffWeapon,
} from "./weaponCategorization.js";
import { processEnchantment } from "./enchantmentProcessor.js";
import { groupWeaponsByCategory } from "./weaponGrouping.js";
import { WeapCategories } from "../../../types/weapSchema.js";
import { errorLogger } from "../utils/error-logger-instance.js";

interface RecordMaps {
  mgefMap: Map<string, MgefRecordFromSchema>;
  enchantmentMap: Map<string, EnchRecord>;
  keywordMap: Map<string, KywdRecord>;
}

interface ProcessedWeapons {
  enchantedWeapons: EnchantedWeapon[];
  boundMysticWeapons: BoundMysticWeapon[];
  wandStaffWeapons: WandStaffWeapon[];
}

interface WeaponStats {
  materials: string[];
  weaponTypes: string[];
  enchantments: {
    name: string;
    cost: number;
    chargeAmount: number;
    description: string;
  }[];
}

/**
 * Resolves weapon metadata from pre-resolved keywords
 */
function resolveWeaponMetadataFromKeywords(keywords: string[]): {
  material: string | null;
  isVendorItem: boolean;
} {
  const material = getWeaponMaterial(keywords);
  const isVendorItemFlag = isVendorItem(keywords);

  return {
    material,
    isVendorItem: isVendorItemFlag,
  };
}

/**
 * Determines weapon type with caching for performance
 */
function determineWeaponTypeWithCache(
  weapon: WeapRecord,
  keywordMap: Map<string, KywdRecord>
): string {
  // Use pre-resolved keywords for O(1) lookup
  const keywords =
    weapon.data.KWDA?.map((id) => keywordMap.get(id)?.data.EDID).filter(
      (edid): edid is string => edid !== null && edid !== undefined
    ) || [];

  // First check for spear keywords specifically to prioritize them
  const hasSpear = keywords.some(
    (keyword) =>
      keyword === "WeapTypeSpear" ||
      keyword === "OCF_WeapTypeSpear1H" ||
      keyword === "OCF_WeapTypeSpear2H"
  );

  if (hasSpear) {
    // Check for 1H/2H variants
    if (keywords.includes("OCF_WeapTypeSpear2H")) {
      return "Two-Handed Spear";
    }
    if (keywords.includes("OCF_WeapTypeSpear1H")) {
      return "One-Handed Spear";
    }
    return "Spear"; // Default to generic spear if no specific variant found
  }

  // Then check other weapon types
  for (const keyword of keywords) {
    if (WeaponTypeKeywords[keyword]) {
      return WeaponTypeKeywords[keyword];
    }
  }

  // Fallback to animation type if no weapon type keywords found
  const animationType = weapon.data.DNAM.animationType;
  if (typeof animationType === "string") {
    return WeapCategories[animationType] || animationType;
  } else if (Array.isArray(animationType)) {
    // Use the first animation type in the array
    const firstType = animationType[0];
    return WeapCategories[firstType] || firstType || "Unknown";
  } else if (typeof animationType === "number") {
    return WeapCategories[animationType.toString()] || "Unknown";
  }
  return "Unknown";
}

/**
 * Determines weapon type from keywords (imported from weaponKeywordResolver)
 */
function determineWeaponTypeFromKeywords(keywords: string[]): string {
  // Look for weapon type keywords first
  for (const keyword of keywords) {
    if (WeaponTypeKeywords[keyword]) {
      return WeaponTypeKeywords[keyword];
    }
  }

  // Fallback to "Unknown" if no weapon type keyword found
  return "Unknown";
}

/**
 * Builds lookup maps for efficient record access
 */
async function buildRecordMaps(
  magicEffectRecords: MgefRecordFromSchema[],
  enchantmentRecords: EnchRecord[],
  keywordRecords: KywdRecord[]
): Promise<RecordMaps> {
  // Load FormID resolver
  try {
    await formIdResolver.loadPluginRegistry();
    console.log(
      `🔍 FormID resolver loaded with ${Object.keys(formIdResolver).length} plugins`
    );
  } catch (error) {
    errorLogger.logError(`Failed to load FormID resolver: ${error}`, { error });
    console.warn(`⚠️  Will continue without FormID resolution`);
  }

  const mgefMap = new Map<string, MgefRecordFromSchema>();
  const enchantmentMap = new Map<string, EnchRecord>();
  const keywordMap = new Map<string, KywdRecord>();

  // Build magic effect map
  for (const mgef of magicEffectRecords) {
    const formId = mgef.meta.globalFormId.toLowerCase();
    mgefMap.set(formId, mgef);
  }

  // Build enchantment map - store both original and lowercase FormIDs
  for (const ench of enchantmentRecords) {
    const formId = ench.meta.globalFormId;
    enchantmentMap.set(formId, ench); // Original FormID
    enchantmentMap.set(formId.toLowerCase(), ench); // Lowercase FormID

    // Log any duplicate FormIDs
    if (enchantmentMap.has(formId) && enchantmentMap.get(formId) !== ench) {
      errorLogger.logError(`Duplicate enchantment FormID detected`, {
        formId,
        edid: ench.data.EDID,
        plugin: ench.meta.plugin,
      });
    }
  }

  // Build keyword map
  for (const kwd of keywordRecords) {
    keywordMap.set(kwd.meta.globalFormId, kwd);
  }

  console.log(
    `📊 Built maps:`,
    `\n- Magic Effects: ${mgefMap.size}`,
    `\n- Enchantments: ${enchantmentMap.size / 2} (${enchantmentMap.size} entries including case variants)`,
    `\n- Keywords: ${keywordMap.size}`
  );

  return { mgefMap, enchantmentMap, keywordMap };
}

/**
 * Filters weapons that should be processed
 */
function filterProcessableWeapons(weaponRecords: WeapRecord[]): WeapRecord[] {
  return weaponRecords.filter((weapon) => {
    if (!weapon.data.EITM || weapon.data.EITM.trim() === "") return false;
    if (weapon.data.EDID?.startsWith("REQ_NULL_")) return false;
    if (weapon.data.EDID?.startsWith("RPC_Replica")) return false;
    if (weapon.data.DNAM?.flags1?.includes("Unplayable")) return false;

    const weaponName = weapon.data.FULL?.toLowerCase() || "";
    if (weaponName.includes("lunar ")) return false;
    if (weaponName.includes("daedric") && weaponName.includes("of the inferno"))
      return false;
    if (weaponName.includes("poison-coated falmer war axe")) return false;

    return true;
  });
}

/**
 * Processes a single weapon record into an EnchantedWeapon
 */
async function processWeaponRecord(
  weapon: WeapRecord,
  recordMaps: RecordMaps
): Promise<EnchantedWeapon | BoundMysticWeapon | WandStaffWeapon | null> {
  try {
    const enchantmentFormId = weapon.data.EITM;
    if (!enchantmentFormId) {
      errorLogger.logError(`Missing enchantment FormID`, {
        weaponName: weapon.data.EDID,
        formId: weapon.meta.globalFormId,
        plugin: weapon.meta.plugin,
      });
      return null;
    }

    const enchantment = recordMaps.enchantmentMap.get(enchantmentFormId);
    if (!enchantment) {
      errorLogger.logError(`Could not find enchantment record`, {
        weaponName: weapon.data.EDID,
        formId: weapon.meta.globalFormId,
        plugin: weapon.meta.plugin,
        enchantmentFormId,
      });
      return null;
    }

    if (!enchantment.data.effects?.length) {
      errorLogger.logError(`Enchantment has no effects`, {
        weaponName: weapon.data.EDID,
        formId: weapon.meta.globalFormId,
        plugin: weapon.meta.plugin,
        enchantmentFormId,
        enchantmentEdid: enchantment.data.EDID,
      });
      return null;
    }

    const enchantmentObj = await processEnchantment(
      enchantment,
      recordMaps.mgefMap
    );
    if (!enchantmentObj) {
      errorLogger.logError(`Failed to process enchantment`, {
        weaponName: weapon.data.EDID,
        formId: weapon.meta.globalFormId,
        plugin: weapon.meta.plugin,
        enchantmentFormId,
        enchantmentEdid: enchantment.data.EDID,
      });
      return null;
    }

    const keywords =
      weapon.data.KWDA?.map(
        (id) => recordMaps.keywordMap.get(id)?.data.EDID
      ).filter((edid): edid is string => edid !== null && edid !== undefined) ||
      [];

    const { material, isVendorItem } =
      resolveWeaponMetadataFromKeywords(keywords);
    const weaponType = determineWeaponTypeWithCache(
      weapon,
      recordMaps.keywordMap
    );

    const enchantedWeapon: EnchantedWeapon = {
      name: getBestDisplayName(weapon.data),
      weaponType,
      baseDamage: weapon.data.DATA.damage,
      weight: weapon.data.DATA.weight,
      value: weapon.data.DATA.value,
      enchantment: {
        ...enchantmentObj,
        chargeAmount: weapon.data.EAMT || enchantmentObj.chargeAmount,
      },
      globalFormId: weapon.meta.globalFormId,
      plugin: weapon.meta.plugin,
      keywords,
      material,
      isVendorItem,
      description: weapon.data.DESC || null,
      cannotDisenchant: keywords.includes("MagicDisallowEnchanting"),
    };

    if (isBoundMysticWeapon(enchantedWeapon)) {
      return convertToBoundMysticWeapon(enchantedWeapon);
    }
    if (isWandOrStaff(enchantedWeapon)) {
      return convertToWandStaffWeapon(enchantedWeapon);
    }
    return enchantedWeapon;
  } catch (error) {
    errorLogger.logError(`Error processing weapon ${weapon.data.EDID}`, {
      weaponName: weapon.data.EDID,
      formId: weapon.meta.globalFormId,
      plugin: weapon.meta.plugin,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

/**
 * Processes all weapon records with performance monitoring
 */
async function processWeaponRecords(
  weapons: WeapRecord[],
  recordMaps: RecordMaps
): Promise<ProcessedWeapons> {
  const startTime = Date.now();
  let processedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  const enchantedWeapons: EnchantedWeapon[] = [];
  const boundMysticWeapons: BoundMysticWeapon[] = [];
  const wandStaffWeapons: WandStaffWeapon[] = [];

  console.log(`Starting to process ${weapons.length} weapons...`);

  for (const weapon of weapons) {
    try {
      const result = await processWeaponRecord(weapon, recordMaps);
      if (result) {
        if ("isBound" in result) {
          boundMysticWeapons.push(result as BoundMysticWeapon);
        } else if ("isWandOrStaff" in result) {
          wandStaffWeapons.push(result as WandStaffWeapon);
        } else {
          enchantedWeapons.push(result as EnchantedWeapon);
        }
        processedCount++;
      } else {
        skippedCount++;
        errorLogger.logError(`Skipped weapon processing`, {
          weaponName: weapon.data.EDID,
          formId: weapon.meta.globalFormId,
          plugin: weapon.meta.plugin,
          reason: "processWeaponRecord returned null",
        });
      }
    } catch (error) {
      errorCount++;
      errorLogger.logError(`Failed to process weapon`, {
        weaponName: weapon.data.EDID,
        formId: weapon.meta.globalFormId,
        plugin: weapon.meta.plugin,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    if ((processedCount + skippedCount + errorCount) % 1000 === 0) {
      const elapsed = Date.now() - startTime;
      const rate =
        (processedCount + skippedCount + errorCount) / (elapsed / 1000);
      console.log(
        `📊 Progress: ${processedCount + skippedCount + errorCount}/${weapons.length} weapons`,
        `\n- Processed: ${processedCount}`,
        `\n- Skipped: ${skippedCount}`,
        `\n- Errors: ${errorCount}`,
        `\n- Rate: ${rate.toFixed(1)}/sec`
      );
    }
  }

  const totalTime = Date.now() - startTime;
  console.log(
    `✅ Processing complete:`,
    `\n- Total weapons: ${weapons.length}`,
    `\n- Successfully processed: ${processedCount}`,
    `\n- Skipped: ${skippedCount}`,
    `\n- Errors: ${errorCount}`,
    `\n- Time: ${totalTime}ms`,
    `\n- Rate: ${(processedCount / (totalTime / 1000)).toFixed(1)}/sec`,
    `\n\nResults:`,
    `\n- Enchanted weapons: ${enchantedWeapons.length}`,
    `\n- Bound/Mystic weapons: ${boundMysticWeapons.length}`,
    `\n- Wands/Staves: ${wandStaffWeapons.length}`
  );

  return { enchantedWeapons, boundMysticWeapons, wandStaffWeapons };
}

/**
 * Collects and calculates weapon statistics
 */
function calculateWeaponStats(weapons: EnchantedWeapon[]): WeaponStats {
  const materials = Array.from(
    new Set(
      weapons
        .map((w) => w.material)
        .filter((m): m is string => m !== null && m !== undefined)
        .sort()
    )
  );

  const weaponTypes = Array.from(
    new Set(weapons.map((w) => w.weaponType).sort())
  );

  const enchantments = Array.from(
    new Set(
      weapons
        .map((w) => w.enchantment)
        .filter((e) => e !== null)
        .map((e) => ({
          name: e.name,
          cost: e.cost,
          chargeAmount: e.chargeAmount,
          description: e.effects.map((ef) => ef.description).join("; "),
        }))
    )
  ).sort((a, b) => a.name.localeCompare(b.name));

  return { materials, weaponTypes, enchantments };
}

/**
 * Deduplicates a list of weapons based on name, stats, and enchantment.
 * Weapons are considered duplicates if they have the same name, base damage, value, and enchantment name.
 */
function deduplicateWeaponList<T extends EnchantedWeapon>(
  weapons: T[],
  context: string = "weapon"
): T[] {
  const deduplicated = weapons.reduce((acc: T[], current) => {
    const duplicate = acc.find(
      (weapon) =>
        weapon.name === current.name &&
        weapon.baseDamage === current.baseDamage &&
        weapon.value === current.value &&
        weapon.enchantment.name === current.enchantment.name
    );

    if (!duplicate) {
      acc.push(current);
    } else {
      console.log(
        `📝 Skipping duplicate ${context}: ${current.name} (${current.globalFormId}) - matches ${duplicate.globalFormId}`
      );
    }
    return acc;
  }, []);

  console.log(
    `📊 ${context} deduplication:`,
    `\n- Original count: ${weapons.length}`,
    `\n- After deduplication: ${deduplicated.length}`,
    `\n- Duplicates removed: ${weapons.length - deduplicated.length}`
  );

  return deduplicated;
}

/**
 * Main function to resolve enchanted weapons
 */
export async function resolveEnchantedWeapons(
  weaponRecords: WeapRecord[],
  enchantmentRecords: EnchRecord[],
  magicEffectRecords: MgefRecordFromSchema[],
  keywordRecords: KywdRecord[]
): Promise<{
  uniqueWeapons: UniqueWeapon[];
  generalWeaponTemplates: GeneralWeaponTemplate[];
  generalWeaponEnchantments: GeneralWeaponEnchantment[];
  baseWeaponTemplates: GeneralWeaponTemplate[];
  allWeapons: EnchantedWeapon[];
  boundMysticWeapons: BoundMysticWeapon[];
  wandStaffWeapons: WandStaffWeapon[];
  materials: string[];
  weaponTypes: string[];
  enchantments: {
    name: string;
    cost: number;
    chargeAmount: number;
    description: string;
  }[];
}> {
  // 1. Build lookup maps
  const recordMaps = await buildRecordMaps(
    magicEffectRecords,
    enchantmentRecords,
    keywordRecords
  );

  // 2. Filter weapons to process
  const processableWeapons = filterProcessableWeapons(weaponRecords);
  console.log(`🔍 Processing ${processableWeapons.length} weapons...`);

  // 3. Process weapons
  const processedWeapons = await processWeaponRecords(
    processableWeapons,
    recordMaps
  );
  const { enchantedWeapons, boundMysticWeapons, wandStaffWeapons } =
    processedWeapons;

  console.log(
    `📊 Processed weapons breakdown:`,
    `\n- Enchanted: ${enchantedWeapons.length}`,
    `\n- Bound/Mystic: ${boundMysticWeapons.length}`,
    `\n- Wands/Staves: ${wandStaffWeapons.length}`,
    `\n- Total: ${enchantedWeapons.length + boundMysticWeapons.length + wandStaffWeapons.length}`
  );

  // 4. Find base template weapons
  const baseTemplateWeapons = weaponRecords.filter(
    (weapon) =>
      !weapon.data.EITM &&
      weapon.data.EDID &&
      !weapon.data.EDID.startsWith("REQ_NULL_")
  );

  // 5. Classify weapons
  const {
    uniqueWeapons,
    generalWeaponTemplates,
    generalWeaponEnchantments,
    baseWeaponTemplates,
  } = separateUniqueAndGeneralWeapons(
    enchantedWeapons,
    weaponRecords,
    baseTemplateWeapons
  );

  // 6. Calculate stats
  const stats = calculateWeaponStats(enchantedWeapons);

  // 7. Unique Weapon's Final Filtering / Polish
  const deduplicatedUniqueWeapons = deduplicateWeaponList(
    uniqueWeapons,
    "unique weapon"
  );

  return {
    uniqueWeapons: deduplicatedUniqueWeapons,
    generalWeaponTemplates,
    generalWeaponEnchantments,
    baseWeaponTemplates,
    allWeapons: enchantedWeapons,
    boundMysticWeapons,
    wandStaffWeapons,
    ...stats,
  };
}

// Re-export the grouping function for convenience
export { groupWeaponsByCategory } from "./weaponGrouping.js";

// Re-export types for external use
export type {
  EnchantedWeapon,
  EnchantedWeaponEffect,
  EnchantedWeaponEnchantment,
  WeaponCategory,
  BoundMysticWeapon,
  WandStaffWeapon,
} from "./types.js";
