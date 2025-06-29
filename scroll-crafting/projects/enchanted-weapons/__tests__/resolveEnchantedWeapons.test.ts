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

    // Verify cannotDisenchant field is set correctly
    const weaponsWithDisallowEnchanting = result.allWeapons.filter(
      (weapon) => weapon.cannotDisenchant
    );
    expect(weaponsWithDisallowEnchanting.length).toBeGreaterThan(0);
    expect(weaponsWithDisallowEnchanting.length).toBe(
      Math.ceil(mockData.weapons.length / 3)
    ); // Every third weapon should have MagicDisallowEnchanting
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
    // Since mock weapons have CNAM, they should be classified as general weapons
    const totalCategorized =
      result.uniqueWeapons.length +
      result.generalWeaponTemplates.length +
      result.generalWeaponEnchantments.length +
      result.baseWeaponTemplates.length +
      result.boundMysticWeapons.length +
      result.wandStaffWeapons.length;

    expect(totalCategorized).toBeGreaterThan(0);

    // Since mock weapons have CNAM templates, they should be classified as general weapons
    expect(result.generalWeaponTemplates.length).toBeGreaterThan(0);
    expect(result.generalWeaponEnchantments.length).toBeGreaterThan(0);

    // Mock weapons should not be classified as unique since they have CNAM
    expect(result.uniqueWeapons.length).toBe(0);

    // Mock weapons should not be classified as bound/mystic or wand/staff
    expect(result.boundMysticWeapons.length).toBe(0);
    expect(result.wandStaffWeapons.length).toBe(0);

    // Verify cannotDisenchant field is set correctly for each category
    const weaponsWithDisallowEnchanting = result.allWeapons.filter(
      (weapon) => weapon.cannotDisenchant
    );
    expect(weaponsWithDisallowEnchanting.length).toBe(
      Math.ceil(mockData.weapons.length / 3)
    ); // Every third weapon should have MagicDisallowEnchanting
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

  it("should filter out REQ_NULL_ weapons", async () => {
    const mockData = generateMockData({
      weaponCount: 5,
      enchantmentCount: 3,
      magicEffectCount: 3,
      keywordCount: 5,
    });

    // Add a REQ_NULL_ weapon to the mock data
    const reqNullWeapon = {
      ...mockData.weapons[0],
      data: {
        ...mockData.weapons[0].data,
        EDID: "REQ_NULL_TG07Chillrend001",
        EITM: mockData.enchantments[0].meta.globalFormId, // Give it an enchantment
      },
    };

    const weaponsWithReqNull = [...mockData.weapons, reqNullWeapon];

    const result = await resolveEnchantedWeapons(
      weaponsWithReqNull,
      mockData.enchantments,
      mockData.magicEffects,
      mockData.keywords
    );

    // Verify that the REQ_NULL_ weapon is not in the results
    const reqNullWeaponInResults = result.allWeapons.find(
      (weapon) =>
        weapon.name === reqNullWeapon.data.FULL ||
        weapon.globalFormId === reqNullWeapon.meta.globalFormId
    );
    expect(reqNullWeaponInResults).toBeUndefined();

    // Verify that other weapons are still processed
    expect(result.allWeapons.length).toBeGreaterThan(0);
  });

  it("should filter out RPC_Replica weapons", async () => {
    const mockData = generateMockData({
      weaponCount: 5,
      enchantmentCount: 3,
      magicEffectCount: 3,
      keywordCount: 5,
    });

    // Add an RPC_Replica weapon to the mock data
    const rpcReplicaWeapon = {
      ...mockData.weapons[0],
      data: {
        ...mockData.weapons[0].data,
        EDID: "RPC_Replica_Dawnbreaker",
        EITM: mockData.enchantments[0].meta.globalFormId, // Give it an enchantment
      },
    };

    const weaponsWithRpcReplica = [...mockData.weapons, rpcReplicaWeapon];

    const result = await resolveEnchantedWeapons(
      weaponsWithRpcReplica,
      mockData.enchantments,
      mockData.magicEffects,
      mockData.keywords
    );

    // Verify that the RPC_Replica weapon is not in the results
    const rpcReplicaWeaponInResults = result.allWeapons.find(
      (weapon) =>
        weapon.name === rpcReplicaWeapon.data.FULL ||
        weapon.globalFormId === rpcReplicaWeapon.meta.globalFormId
    );
    expect(rpcReplicaWeaponInResults).toBeUndefined();

    // Verify that other weapons are still processed
    expect(result.allWeapons.length).toBeGreaterThan(0);
  });

  it("should correctly identify weapons that cannot be disenchanted", async () => {
    const mockData = generateMockData({
      weaponCount: 6, // Use multiple of 3 for easier testing
      enchantmentCount: 2,
      magicEffectCount: 2,
      keywordCount: 5,
    });

    const result = await resolveEnchantedWeapons(
      mockData.weapons,
      mockData.enchantments,
      mockData.magicEffects,
      mockData.keywords
    );

    // Every third weapon should have cannotDisenchant set to true
    const disenchantableWeapons = result.allWeapons.filter(
      (weapon) => !weapon.cannotDisenchant
    );
    const nonDisenchantableWeapons = result.allWeapons.filter(
      (weapon) => weapon.cannotDisenchant
    );

    expect(nonDisenchantableWeapons.length).toBe(2); // 6 weapons / 3 = 2 should have MagicDisallowEnchanting
    expect(disenchantableWeapons.length).toBe(4); // The remaining 4 should be disenchantable

    // Verify that weapons with MagicDisallowEnchanting keyword are marked correctly
    for (const weapon of nonDisenchantableWeapons) {
      const weaponRecord = mockData.weapons.find(
        (w) => w.meta.globalFormId === weapon.globalFormId
      );
      expect(weaponRecord).toBeDefined();
      expect(weaponRecord!.data.KWDA).toContain(
        mockData.keywords[mockData.keywords.length - 1].meta.globalFormId
      ); // Should have the MagicDisallowEnchanting keyword
    }
  });
});
