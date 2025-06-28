import {
  WeaponRecord,
  EnchantmentRecord,
  WeaponCategories,
} from "../../../types/weaponSchema.js";
import { findByFormId } from "../../../utils/findByFormId.js";

export interface EnchantedWeaponEffect {
  name: string;
  magnitude: number;
  duration: number;
  area: number;
  description: string;
}

export interface EnchantedWeaponEnchantment {
  name: string;
  cost: number;
  chargeAmount: number;
  effects: EnchantedWeaponEffect[];
}

export interface EnchantedWeapon {
  name: string;
  weaponType: string;
  baseDamage: number;
  weight: number;
  value: number;
  enchantment: EnchantedWeaponEnchantment;
  globalFormId: string;
  plugin: string;
}

export interface WeaponCategory {
  categoryName: string;
  weapons: EnchantedWeapon[];
}

/**
 * Resolves enchanted weapons by linking WEAP, ENCH, and MGEF records
 */
export async function resolveEnchantedWeapons(
  weaponRecords: WeaponRecord[],
  enchantmentRecords: EnchantmentRecord[],
  magicEffectRecords: any[]
): Promise<EnchantedWeapon[]> {
  const enchantedWeapons: EnchantedWeapon[] = [];

  // Filter weapons that have enchantments (EITM field)
  const weaponsWithEnchantments = weaponRecords.filter(
    (weapon) => weapon.data.EITM && weapon.data.EITM.trim() !== ""
  );

  for (const weapon of weaponsWithEnchantments) {
    try {
      // Resolve the enchantment
      const enchantment = findByFormId(enchantmentRecords, weapon.data.EITM!);
      if (!enchantment) {
        console.warn(
          `⚠️  Enchantment not found for weapon ${weapon.data.EDID}: ${weapon.data.EITM}`
        );
        continue;
      }

      // Resolve the magic effect
      const magicEffect = findByFormId(
        magicEffectRecords,
        enchantment.data.EFID
      );
      if (!magicEffect) {
        console.warn(
          `⚠️  Magic effect not found for enchantment ${enchantment.data.EDID}: ${enchantment.data.EFID}`
        );
        continue;
      }

      // Create the effect object
      const effect: EnchantedWeaponEffect = {
        name: magicEffect.data.FULL || magicEffect.data.EDID,
        magnitude: enchantment.data.EFIT.magnitude,
        duration: enchantment.data.EFIT.duration,
        area: enchantment.data.EFIT.area,
        description:
          magicEffect.data.DESC || `Effect from ${magicEffect.data.EDID}`,
      };

      // Create the enchantment object
      const enchantmentObj: EnchantedWeaponEnchantment = {
        name: enchantment.data.FULL || enchantment.data.EDID,
        cost: enchantment.data.ENIT.enchantmentCost,
        chargeAmount: enchantment.data.ENIT.chargeAmount,
        effects: [effect],
      };

      // Determine weapon type from animation type
      const weaponType =
        WeaponCategories[weapon.data.DNAM.animationType] || "Unknown";

      // Create the enchanted weapon object
      const enchantedWeapon: EnchantedWeapon = {
        name: weapon.data.FULL || weapon.data.EDID,
        weaponType,
        baseDamage: weapon.data.DATA.damage,
        weight: weapon.data.DATA.weight,
        value: weapon.data.DATA.value,
        enchantment: enchantmentObj,
        globalFormId: weapon.meta.globalFormId,
        plugin: weapon.meta.plugin,
      };

      enchantedWeapons.push(enchantedWeapon);
    } catch (error) {
      console.error(`❌ Error processing weapon ${weapon.data.EDID}:`, error);
    }
  }

  return enchantedWeapons;
}

/**
 * Groups enchanted weapons by their weapon category
 */
export function groupWeaponsByCategory(
  weapons: EnchantedWeapon[]
): WeaponCategory[] {
  const categoryMap = new Map<string, EnchantedWeapon[]>();

  // Group weapons by category
  for (const weapon of weapons) {
    const category = weapon.weaponType;
    if (!categoryMap.has(category)) {
      categoryMap.set(category, []);
    }
    categoryMap.get(category)!.push(weapon);
  }

  // Convert to array format and sort categories
  const categories: WeaponCategory[] = Array.from(categoryMap.entries()).map(
    ([categoryName, weapons]) => ({
      categoryName,
      weapons: weapons.sort((a, b) => a.name.localeCompare(b.name)),
    })
  );

  // Sort categories by name
  return categories.sort((a, b) =>
    a.categoryName.localeCompare(b.categoryName)
  );
}
