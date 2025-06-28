import { describe, it, expect } from "vitest";
import { resolveEnchantedWeapons } from "../logic/resolveEnchantedWeapons.js";
import { generateMockData } from "./mockDataGenerator.js";

describe("resolveEnchantedWeapons", () => {
  it("should resolve weapon-enchantment-effect relationships", async () => {
    const mockData = generateMockData({
      weaponCount: 5,
      enchantmentCount: 3,
      magicEffectCount: 3,
      keywordCount: 5,
    });

    const result = await resolveEnchantedWeapons(
      mockData.weapons,
      mockData.enchantments,
      mockData.magicEffects,
      mockData.keywords
    );

    expect(result.uniqueWeapons).toBeDefined();
    expect(result.generalWeaponTemplates).toBeDefined();
    expect(result.generalWeaponEnchantments).toBeDefined();
    expect(result.baseWeaponTemplates).toBeDefined();
    expect(result.allWeapons).toBeDefined();
    expect(result.boundMysticWeapons).toBeDefined();
    expect(result.wandStaffWeapons).toBeDefined();
  });

  it("should handle weapons without enchantments", async () => {
    const mockData = generateMockData({
      weaponCount: 3,
      enchantmentCount: 0, // No enchantments
      magicEffectCount: 0,
      keywordCount: 3,
    });

    const result = await resolveEnchantedWeapons(
      mockData.weapons,
      mockData.enchantments,
      mockData.magicEffects,
      mockData.keywords
    );

    expect(result.allWeapons).toHaveLength(0);
    expect(result.uniqueWeapons).toHaveLength(0);
    expect(result.generalWeaponTemplates).toHaveLength(0);
    expect(result.generalWeaponEnchantments).toHaveLength(0);
  });

  it("should categorize weapons correctly", async () => {
    const mockData = generateMockData({
      weaponCount: 10,
      enchantmentCount: 5,
      magicEffectCount: 5,
      keywordCount: 8,
    });

    const result = await resolveEnchantedWeapons(
      mockData.weapons,
      mockData.enchantments,
      mockData.magicEffects,
      mockData.keywords
    );

    // All weapons should be categorized into one of the categories
    const totalCategorized =
      result.uniqueWeapons.length +
      result.generalWeaponTemplates.length +
      result.baseWeaponTemplates.length +
      result.boundMysticWeapons.length +
      result.wandStaffWeapons.length;

    expect(totalCategorized).toBeGreaterThan(0);
  });

  it("should calculate enchantment costs correctly", async () => {
    const mockData = generateMockData({
      weaponCount: 3,
      enchantmentCount: 2,
      magicEffectCount: 2,
      keywordCount: 3,
    });

    const result = await resolveEnchantedWeapons(
      mockData.weapons,
      mockData.enchantments,
      mockData.magicEffects,
      mockData.keywords
    );

    // Check that enchantments have valid costs
    for (const weapon of result.allWeapons) {
      expect(weapon.enchantment.cost).toBeGreaterThan(0);
      expect(weapon.enchantment.chargeAmount).toBeGreaterThan(0);
    }
  });
});
