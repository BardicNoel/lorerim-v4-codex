// Main resolution function
export { resolveEnchantedWeapons } from "./resolveEnchantedWeapons.js";

// Pattern recognition
export { detectWeaponPatterns, parseWeaponName } from "./patternRecognition.js";

// Weapon classification
export {
  separateUniqueAndPatternWeapons,
  classifyWeaponUniqueness,
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
export type { UniqueWeapon } from "./weaponClassification.js";
