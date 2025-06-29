import { WeapRecord, WeapCategories } from "../../../types/weapSchema.js";
import { KywdRecord } from "../../../types/kywdSchema.js";
import {
  resolveWeaponKeywords,
  determineWeaponTypeFromKeywords,
} from "../../../utils/weaponKeywordResolver.js";

/**
 * Determines weapon type from keywords, with fallback to animation type
 */
export function determineWeaponType(
  weapon: WeapRecord,
  keywordRecords: KywdRecord[]
): string {
  // First try to determine from keywords
  if (weapon.data.KWDA && weapon.data.KWDA.length > 0) {
    const keywords = resolveWeaponKeywords(weapon.data.KWDA, keywordRecords);

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
