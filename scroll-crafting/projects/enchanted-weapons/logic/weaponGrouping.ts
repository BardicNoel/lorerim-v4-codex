import { EnchantedWeapon, WeaponCategory } from "./types.js";

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
