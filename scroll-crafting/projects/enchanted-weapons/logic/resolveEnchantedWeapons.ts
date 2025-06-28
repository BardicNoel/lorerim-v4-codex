import { WeapRecord } from "../../../types/weapSchema.js";
import { EnchRecord } from "../../../types/enchSchema.js";
import { KywdRecord } from "../../../types/kywdSchema.js";
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
import { errorLogger } from "../utils/errorLogger.js";

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

  // First try to determine from keywords
  if (keywords.length > 0) {
    const weaponType = determineWeaponTypeFromKeywords(keywords);
    if (weaponType !== "Unknown") {
      return weaponType;
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
 * Resolves enchanted weapons by linking WEAP, ENCH, and MGEF records
 * Now uses CNAM-based classification for unique vs general weapons
 */
export async function resolveEnchantedWeapons(
  weaponRecords: WeapRecord[],
  enchantmentRecords: EnchRecord[],
  magicEffectRecords: any[],
  keywordRecords: KywdRecord[]
): Promise<{
  uniqueWeapons: UniqueWeapon[];
  generalWeaponTemplates: GeneralWeaponTemplate[];
  generalWeaponEnchantments: GeneralWeaponEnchantment[];
  baseWeaponTemplates: GeneralWeaponTemplate[];
  allWeapons: EnchantedWeapon[];
  boundMysticWeapons: BoundMysticWeapon[];
  wandStaffWeapons: WandStaffWeapon[];
}> {
  // Load the FormID resolver
  try {
    await formIdResolver.loadPluginRegistry();
    console.log(
      `🔍 FormID resolver loaded with ${Object.keys(formIdResolver).length} plugins`
    );
  } catch (error) {
    errorLogger.logError(`Failed to load FormID resolver: ${error}`, { error });
    console.warn(`⚠️  Will continue without FormID resolution`);
  }

  // Build all lookup maps once for O(1) access
  console.log("🔧 Building lookup maps...");
  const mgefMap = new Map<string, any>();
  const enchantmentMap = new Map<string, EnchRecord>();
  const keywordMap = new Map<string, KywdRecord>();

  // Pre-populate magic effect map
  for (const mgef of magicEffectRecords) {
    mgefMap.set(mgef.meta.globalFormId.toLowerCase(), mgef);
  }

  // Pre-populate enchantment map
  for (const ench of enchantmentRecords) {
    enchantmentMap.set(ench.meta.globalFormId, ench);
  }

  // Pre-populate keyword map
  for (const kwd of keywordRecords) {
    keywordMap.set(kwd.meta.globalFormId, kwd);
  }

  console.log(
    `📊 Built maps: ${mgefMap.size} magic effects, ${enchantmentMap.size} enchantments, ${keywordMap.size} keywords`
  );

  const enchantedWeapons: EnchantedWeapon[] = [];
  const boundMysticWeapons: BoundMysticWeapon[] = [];
  const wandStaffWeapons: WandStaffWeapon[] = [];

  // Filter weapons that have enchantments (EITM field)
  const weaponsWithEnchantments = weaponRecords.filter(
    (weapon) => weapon.data.EITM && weapon.data.EITM.trim() !== ""
  );

  console.log(
    `🔍 Processing ${weaponsWithEnchantments.length} weapons with enchantments...`
  );

  const startTime = Date.now();
  let processedWeapons = 0;

  for (const weapon of weaponsWithEnchantments) {
    try {
      // Early exit for weapons without enchantments
      if (!weapon.data.EITM?.trim()) continue;

      // O(1) enchantment lookup instead of O(n) find
      const enchantment = enchantmentMap.get(weapon.data.EITM);
      if (!enchantment) {
        errorLogger.logMissingEnchantment(
          weapon.data.EDID,
          weapon.data.EITM,
          weapon.meta.plugin
        );
        continue;
      }

      // Early exit for enchantments without effects
      if (!enchantment.data.effects?.length) continue;

      // Process enchantment (now async)
      const enchantmentObj = await processEnchantment(enchantment, mgefMap);
      if (!enchantmentObj) {
        continue;
      }

      // O(1) keyword resolution using pre-built map
      const keywords =
        weapon.data.KWDA?.map((id) => keywordMap.get(id)?.data.EDID).filter(
          (edid): edid is string => edid !== null && edid !== undefined
        ) || [];

      // Resolve weapon metadata using resolved keywords
      const { material, isVendorItem } =
        resolveWeaponMetadataFromKeywords(keywords);

      // Determine weapon type from keywords (with animation fallback)
      const weaponType = determineWeaponTypeWithCache(weapon, keywordMap);

      // Create the enchanted weapon object
      const enchantedWeapon: EnchantedWeapon = {
        name: getBestDisplayName(weapon.data),
        weaponType,
        baseDamage: weapon.data.DATA.damage,
        weight: weapon.data.DATA.weight,
        value: weapon.data.DATA.value,
        enchantment: enchantmentObj,
        globalFormId: weapon.meta.globalFormId,
        plugin: weapon.meta.plugin,
        keywords,
        material,
        isVendorItem,
        description: weapon.data.DESC || null,
      };

      // Early exit for bound/mystic weapons (skip CNAM classification)
      if (isBoundMysticWeapon(enchantedWeapon)) {
        boundMysticWeapons.push(convertToBoundMysticWeapon(enchantedWeapon));
      } else if (isWandOrStaff(enchantedWeapon)) {
        wandStaffWeapons.push(convertToWandStaffWeapon(enchantedWeapon));
      } else {
        enchantedWeapons.push(enchantedWeapon);
      }

      // Performance monitoring
      processedWeapons++;
      if (processedWeapons % 1000 === 0) {
        const elapsed = Date.now() - startTime;
        const rate = processedWeapons / (elapsed / 1000);
        console.log(
          `📊 Processed ${processedWeapons} weapons at ${rate.toFixed(1)}/sec`
        );
      }
    } catch (error) {
      errorLogger.logError(`Error processing weapon ${weapon.data.EDID}`, {
        weaponName: weapon.data.EDID,
        formId: weapon.meta.globalFormId,
        plugin: weapon.meta.plugin,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  const totalTime = Date.now() - startTime;
  const finalRate = processedWeapons / (totalTime / 1000);
  console.log(
    `✅ Successfully processed ${enchantedWeapons.length} enchanted weapons, ${boundMysticWeapons.length} bound/mystic weapons, and ${wandStaffWeapons.length} wands/staves`
  );
  console.log(
    `⏱️  Total processing time: ${totalTime}ms (${finalRate.toFixed(1)} weapons/sec)`
  );

  // Classify weapons using CNAM-based approach
  console.log("🔍 Classifying weapons using CNAM templates...");
  const {
    uniqueWeapons,
    generalWeaponTemplates,
    generalWeaponEnchantments,
    baseWeaponTemplates,
  } = separateUniqueAndGeneralWeapons(enchantedWeapons, weaponRecords);
  console.log(
    `📊 Found ${uniqueWeapons.length} unique weapons, ${generalWeaponTemplates.length} general weapon templates, ${generalWeaponEnchantments.length} general enchantments, and ${baseWeaponTemplates.length} base weapon templates`
  );

  return {
    uniqueWeapons,
    generalWeaponTemplates,
    generalWeaponEnchantments,
    baseWeaponTemplates,
    allWeapons: enchantedWeapons,
    boundMysticWeapons,
    wandStaffWeapons,
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
