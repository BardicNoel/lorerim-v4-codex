import { KywdRecord } from "../types/kywdSchema.js";
import { findByFormId } from "./findByFormId.js";

/**
 * Maps weapon type keywords to readable weapon type names
 */
export const WeaponTypeKeywords: Record<string, string> = {
  // Vanilla weapon types
  WeapTypeSword: "One-Handed Sword",
  WeapTypeDagger: "Dagger",
  WeapTypeWarAxe: "One-Handed Axe",
  WeapTypeMace: "One-Handed Mace",
  WeapTypeGreatsword: "Two-Handed Sword",
  WeapTypeBattleaxe: "Two-Handed Axe",
  WeapTypeWarhammer: "Two-Handed Mace",
  WeapTypeBow: "Bow",
  WeapTypeStaff: "Staff",
  WeapTypeCrossbow: "Crossbow",
  WeapTypeQtrStaff: "Quarterstaff",
  WeapTypeTdagger: "Throwing Dagger",

  // Ordinator weapon types
  OCF_WeapTypeDagger1H: "One-Handed Dagger",
  OCF_WeapTypeRevDagger1H: "Reverse Grip Dagger",
  OCF_WeapTypeSword1H: "One-Handed Sword",
  OCF_WeapTypeShortsword1H: "Shortsword",
  OCF_WeapTypeCurvedSword1H: "Curved Sword",
  OCF_WeapTypeWarAxe1H: "One-Handed Axe",
  OCF_WeapTypeWoodaxe1H: "Woodaxe",
  OCF_WeapTypeMace1H: "One-Handed Mace",
  OCF_WeapTypePickaxe1H: "Pickaxe",
  OCF_WeapTypeQuarterstaff1H: "Quarterstaff",

  OCF_WeapTypeGreatsword2H: "Two-Handed Sword",
  OCF_WeapTypeMassiveSword2H: "Massive Sword",
  OCF_WeapTypeCurvedSword2H: "Curved Greatsword",
  OCF_WeapTypeBattleaxe2H: "Two-Handed Axe",
  OCF_WeapTypeMassiveAxe2H: "Massive Axe",
  OCF_WeapTypeWarhammer2H: "Two-Handed Mace",
  OCF_WeapTypeMace2H: "Two-Handed Mace",
  OCF_WeapTypePickaxe2H: "Two-Handed Pickaxe",
  OCF_WeapTypeWoodaxe2H: "Two-Handed Woodaxe",
  OCF_WeapTypeQuarterstaff2H: "Two-Handed Quarterstaff",
  OCF_WeapTypeBladestaff2H: "Bladestaff",

  OCF_WeapTypeBow: "Bow",
  OCF_WeapTypeBow2H: "Two-Handed Bow",
  OCF_WeapTypeShortbow2H: "Shortbow",
  OCF_WeapTypeLongbow2H: "Longbow",
  OCF_WeapTypeGreatbow2H: "Greatbow",
  OCF_WeapTypeBowblade2H: "Bowblade",
  OCF_WeapTypeCrossbow: "Crossbow",
  OCF_WeapTypeCrossbow1H: "One-Handed Crossbow",
  OCF_WeapTypeCrossbow2H: "Two-Handed Crossbow",

  OCF_WeapTypeStaff1H: "One-Handed Staff",
  OCF_WeapTypeStaffBlank: "Blank Staff",
};

/**
 * Vendor keywords that indicate the item is sold by vendors
 */
export const VendorKeywords: Record<string, string> = {
  VendorItemWeapon: "Vendor Weapon",
  VendorItemStaff: "Vendor Staff",
  VendorItemSpellTome: "Vendor Spell Tome",
};

/**
 * Material keywords that indicate weapon material
 */
export const MaterialKeywords: Record<string, string> = {
  WeapMaterialIron: "Iron",
  WeapMaterialSteel: "Steel",
  WeapMaterialOrcish: "Orcish",
  WeapMaterialDwarven: "Dwarven",
  WeapMaterialElven: "Elven",
  WeapMaterialGlass: "Glass",
  WeapMaterialEbony: "Ebony",
  WeapMaterialDaedric: "Daedric",
  WeapMaterialWood: "Wood",
  WeapMaterialSilver: "Silver",
  WeapMaterialNordic: "Nordic",
  WeapMaterialStalhrim: "Stalhrim",
};

/**
 * Resolves a FormID to its keyword EDID
 */
export function resolveKeywordFormId(
  formId: string,
  keywordRecords: KywdRecord[]
): string | null {
  const keyword = findByFormId(keywordRecords, formId);
  return keyword?.data.EDID || null;
}

/**
 * Resolves all weapon keywords from FormIDs to EDIDs
 */
export function resolveWeaponKeywords(
  keywordFormIds: string[],
  keywordRecords: KywdRecord[]
): string[] {
  return keywordFormIds
    .map((formId) => resolveKeywordFormId(formId, keywordRecords))
    .filter((edid): edid is string => edid !== null);
}

/**
 * Determines weapon type from keywords
 */
export function determineWeaponTypeFromKeywords(keywords: string[]): string {
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
 * Checks if a weapon is a vendor item
 */
export function isVendorItem(keywords: string[]): boolean {
  return keywords.some((keyword) => VendorKeywords[keyword]);
}

/**
 * Gets the material of a weapon from keywords
 */
export function getWeaponMaterial(keywords: string[]): string | null {
  for (const keyword of keywords) {
    if (MaterialKeywords[keyword]) {
      return MaterialKeywords[keyword];
    }
  }
  return null;
}

/**
 * Gets all weapon type keywords found in the keywords array
 */
export function getWeaponTypeKeywords(keywords: string[]): string[] {
  return keywords.filter((keyword) => WeaponTypeKeywords[keyword]);
}

/**
 * Gets all vendor keywords found in the keywords array
 */
export function getVendorKeywords(keywords: string[]): string[] {
  return keywords.filter((keyword) => VendorKeywords[keyword]);
}

/**
 * Gets all material keywords found in the keywords array
 */
export function getMaterialKeywords(keywords: string[]): string[] {
  return keywords.filter((keyword) => MaterialKeywords[keyword]);
}

/**
 * Hydrates a MGEF DNAM description with magnitude, duration, and area values
 * Replaces <mag>, <dur>, and <area> placeholders with actual values
 */
export function hydrateMgefDescription(
  description: string | undefined,
  magnitude: number,
  duration: number,
  area: number
): string {
  // Handle undefined description
  if (!description) {
    return `Effect with magnitude ${magnitude}, duration ${duration}, area ${area}`;
  }

  let hydratedDesc = description;

  // Replace magnitude placeholders
  if (typeof magnitude === "number") {
    hydratedDesc = hydratedDesc.replace(
      /<mag>|&lt;mag&gt;/gi,
      `<${magnitude}>`
    );
  }

  // Replace duration placeholders
  if (typeof duration === "number") {
    hydratedDesc = hydratedDesc.replace(/<dur>|&lt;dur&gt;/gi, `<${duration}>`);
  }

  // Replace area placeholders
  if (typeof area === "number") {
    hydratedDesc = hydratedDesc.replace(/<area>|&lt;area&gt;/gi, `<${area}>`);
  }

  return hydratedDesc;
}

/**
 * Gets the best display name for a record, preferring FULL over EDID
 */
export function getBestDisplayName(record: {
  FULL?: string;
  EDID?: string;
}): string {
  return record.FULL || record.EDID || "Unknown";
}
