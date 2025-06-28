import {
  EnchantedWeapon,
  BoundMysticWeapon,
  WandStaffWeapon,
} from "./types.js";

/**
 * Identifies if a weapon is a bound or mystic weapon manifestation
 */
export function isBoundMysticWeapon(weapon: EnchantedWeapon): boolean {
  const name = weapon.name.toLowerCase();
  return (
    name.startsWith("bound ") ||
    name.startsWith("mystic ") ||
    name.startsWith("dread ")
  );
}

/**
 * Converts an enchanted weapon to a bound/mystic weapon
 */
export function convertToBoundMysticWeapon(
  weapon: EnchantedWeapon
): BoundMysticWeapon {
  const name = weapon.name.toLowerCase();
  let isBound = false;

  if (name.startsWith("bound ")) {
    isBound = true;
  } else if (name.startsWith("dread ")) {
    isBound = true; // Dread weapons are a form of bound weapons
  }
  // mystic weapons are not bound, they're manifestations

  return {
    name: weapon.name,
    weaponType: weapon.weaponType,
    baseDamage: weapon.baseDamage,
    isBound,
    globalFormId: weapon.globalFormId,
    plugin: weapon.plugin,
    keywords: weapon.keywords,
    material: weapon.material,
    description: weapon.description,
  };
}

/**
 * Identifies if a weapon is a wand or staff
 */
export function isWandOrStaff(weapon: EnchantedWeapon): boolean {
  const name = weapon.name.toLowerCase();
  const weaponType = weapon.weaponType.toLowerCase();
  const hasStaffKeyword = weapon.keywords.some(
    (kw) =>
      kw.toLowerCase().includes("staff") || kw.toLowerCase().includes("wand")
  );

  return (
    name.includes("staff") ||
    name.includes("wand") ||
    weaponType.includes("staff") ||
    weaponType.includes("wand") ||
    hasStaffKeyword
  );
}

/**
 * Converts an enchanted weapon to a wand/staff weapon
 */
export function convertToWandStaffWeapon(
  weapon: EnchantedWeapon
): WandStaffWeapon {
  return {
    name: weapon.name,
    weaponType: weapon.weaponType,
    baseDamage: weapon.baseDamage,
    weight: weapon.weight,
    value: weapon.value,
    enchantment: weapon.enchantment,
    globalFormId: weapon.globalFormId,
    plugin: weapon.plugin,
    keywords: weapon.keywords,
    material: weapon.material,
    isVendorItem: weapon.isVendorItem,
    description: weapon.description,
  };
}
