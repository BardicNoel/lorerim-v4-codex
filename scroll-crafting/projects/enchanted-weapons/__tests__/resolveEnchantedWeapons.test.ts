import { describe, it, expect } from "vitest";
import {
  resolveEnchantedWeapons,
  groupWeaponsByCategory,
} from "../logic/index.js";
import { generateMockData } from "./mockDataGenerator.js";

describe("resolveEnchantedWeapons - Integration", () => {
  it("should resolve complete weapon-enchantment-effect relationships", async () => {
    const mockData = generateMockData({
      weaponCount: 2,
      enchantmentCount: 2,
      magicEffectCount: 2,
      keywordCount: 4,
      weaponTypes: ["Sword", "Bow"],
      materials: ["Steel", "Wood"],
      enchantmentTypes: ["Fire Damage", "Ice Damage"],
    });

    const result = await resolveEnchantedWeapons(
      mockData.weapons,
      mockData.enchantments,
      mockData.magicEffects,
      mockData.keywords
    );

    expect(result.allWeapons).toHaveLength(2);
    expect(result.patterns).toBeDefined();
    expect(result.uniqueWeapons).toBeDefined();
    expect(result.boundMysticWeapons).toBeDefined();
    expect(result.wandStaffWeapons).toBeDefined();

    // Verify weapons have proper enchantments
    result.allWeapons.forEach((weapon) => {
      expect(weapon.enchantment).toBeDefined();
      expect(weapon.enchantment.effects).toHaveLength(1);
      expect(weapon.weaponType).toBeDefined();
      expect(weapon.material).toBeDefined();
    });
  });

  it("should handle weapons without enchantments", async () => {
    const mockData = generateMockData({
      weaponCount: 2,
      enchantmentCount: 0, // No enchantments
      magicEffectCount: 0,
      keywordCount: 2,
    });

    const result = await resolveEnchantedWeapons(
      mockData.weapons,
      mockData.enchantments,
      mockData.magicEffects,
      mockData.keywords
    );

    expect(result.allWeapons).toHaveLength(0);
    expect(result.patterns).toHaveLength(0);
    expect(result.uniqueWeapons).toHaveLength(0);
  });

  it("should handle missing magic effect records", async () => {
    const mockData = generateMockData({
      weaponCount: 1,
      enchantmentCount: 1,
      magicEffectCount: 0, // No magic effects
      keywordCount: 2,
    });

    const result = await resolveEnchantedWeapons(
      mockData.weapons,
      mockData.enchantments,
      mockData.magicEffects,
      mockData.keywords
    );

    expect(result.allWeapons).toHaveLength(0);
  });

  it("should handle weapons with missing enchantment references", async () => {
    const mockData = generateMockData({
      weaponCount: 1,
      enchantmentCount: 1,
      magicEffectCount: 1,
      keywordCount: 2,
    });

    // Remove enchantment reference from weapon
    const weaponsWithoutEnchantments = mockData.weapons.map((weapon) => ({
      ...weapon,
      data: {
        ...weapon.data,
        EITM: undefined,
      },
    }));

    const result = await resolveEnchantedWeapons(
      weaponsWithoutEnchantments,
      mockData.enchantments,
      mockData.magicEffects,
      mockData.keywords
    );

    expect(result.allWeapons).toHaveLength(0);
  });

  it("should properly categorize weapons by type", async () => {
    const mockData = generateMockData({
      weaponCount: 3,
      enchantmentCount: 3,
      magicEffectCount: 3,
      keywordCount: 6,
      weaponTypes: ["Sword", "Bow", "Dagger"],
      materials: ["Steel", "Wood", "Iron"],
    });

    const result = await resolveEnchantedWeapons(
      mockData.weapons,
      mockData.enchantments,
      mockData.magicEffects,
      mockData.keywords
    );

    expect(result.allWeapons).toHaveLength(3);

    // Test grouping separately
    const groupedWeapons = groupWeaponsByCategory(result.allWeapons);
    expect(groupedWeapons).toHaveLength(3);

    // Verify different weapon types are categorized separately
    const categoryNames = groupedWeapons.map((cat: any) => cat.categoryName);
    expect(categoryNames).toContain("Bow");
    expect(categoryNames).toContain("One-Handed Sword");
    expect(categoryNames).toContain("Dagger");
  });
});
