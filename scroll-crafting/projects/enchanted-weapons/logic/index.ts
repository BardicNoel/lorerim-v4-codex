// Main resolution function
export { resolveEnchantedWeapons } from "./resolveEnchantedWeapons.js";

// Pattern recognition
export { detectWeaponPatterns } from "./patternRecognition.js";

// Weapon classification
export {
  separateUniqueAndGeneralWeapons,
  separateUniqueAndPatternWeapons,
  UniqueWeapon,
  GeneralWeaponTemplate,
  GeneralWeaponEnchantment,
} from "./weaponClassification.js";

// Weapon grouping
export { groupWeaponsByCategory } from "./weaponGrouping.js";

// Types
export type {
  EnchantedWeapon,
  EnchantedWeaponEffect,
  EnchantedWeaponEnchantment,
  WeaponCategory,
  BoundMysticWeapon,
  WandStaffWeapon,
} from "./types.js";

export type { WeaponPattern } from "./patternRecognition.js";

export { determineWeaponType } from "./weaponTypeDetection.js";

export {
  isBoundMysticWeapon,
  convertToBoundMysticWeapon,
  isWandOrStaff,
  convertToWandStaffWeapon,
} from "./weaponCategorization.js";

export { processEnchantment } from "./enchantmentProcessor.js";
