import { describe, it, expect } from "vitest";
import { groupWeaponsByCategory } from "../logic/weaponGrouping.js";
import { type EnchantedWeapon } from "../logic/types.js";

describe("weaponGrouping", () => {
  it("should group weapons by category", () => {
    const mockWeapons: EnchantedWeapon[] = [
      {
        name: "Sword 1",
        weaponType: "One-Handed Swords",
        baseDamage: 10,
        weight: 5.0,
        value: 100,
        enchantment: {
          name: "Fire",
          cost: 25,
          chargeAmount: 100,
          effects: [],
          costMethod: "auto",
        },
        globalFormId: "0x1",
        plugin: "Test.esp",
        keywords: ["Sword"],
        material: "Steel",
        isVendorItem: false,
        description: null,
        cannotDisenchant: false,
      },
      {
        name: "Sword 2",
        weaponType: "One-Handed Swords",
        baseDamage: 12,
        weight: 6.0,
        value: 120,
        enchantment: {
          name: "Ice",
          cost: 30,
          chargeAmount: 100,
          effects: [],
          costMethod: "auto",
        },
        globalFormId: "0x2",
        plugin: "Test.esp",
        keywords: ["Sword"],
        material: "Iron",
        isVendorItem: false,
        description: null,
        cannotDisenchant: false,
      },
      {
        name: "Bow 1",
        weaponType: "Bows",
        baseDamage: 8,
        weight: 3.0,
        value: 80,
        enchantment: {
          name: "Lightning",
          cost: 20,
          chargeAmount: 100,
          effects: [],
          costMethod: "auto",
        },
        globalFormId: "0x3",
        plugin: "Test.esp",
        keywords: ["Bow"],
        material: "Wood",
        isVendorItem: false,
        description: null,
        cannotDisenchant: false,
      },
    ];

    const result = groupWeaponsByCategory(mockWeapons);

    expect(result).toHaveLength(2);
    expect(result[0].categoryName).toBe("Bows");
    expect(result[0].weapons).toHaveLength(1);
    expect(result[1].categoryName).toBe("One-Handed Swords");
    expect(result[1].weapons).toHaveLength(2);
  });

  it("should sort weapons alphabetically within categories", () => {
    const mockWeapons: EnchantedWeapon[] = [
      {
        name: "Zebra Sword",
        weaponType: "One-Handed Swords",
        baseDamage: 10,
        weight: 5.0,
        value: 100,
        enchantment: {
          name: "Fire",
          cost: 25,
          chargeAmount: 100,
          effects: [],
          costMethod: "auto",
        },
        globalFormId: "0x1",
        plugin: "Test.esp",
        keywords: ["Sword"],
        material: "Steel",
        isVendorItem: false,
        description: null,
        cannotDisenchant: false,
      },
      {
        name: "Alpha Sword",
        weaponType: "One-Handed Swords",
        baseDamage: 12,
        weight: 6.0,
        value: 120,
        enchantment: {
          name: "Ice",
          cost: 30,
          chargeAmount: 100,
          effects: [],
          costMethod: "auto",
        },
        globalFormId: "0x2",
        plugin: "Test.esp",
        keywords: ["Sword"],
        material: "Iron",
        isVendorItem: false,
        description: null,
        cannotDisenchant: false,
      },
    ];

    const result = groupWeaponsByCategory(mockWeapons);

    expect(result[0].weapons[0].name).toBe("Alpha Sword");
    expect(result[0].weapons[1].name).toBe("Zebra Sword");
  });

  it("should sort categories alphabetically", () => {
    const mockWeapons: EnchantedWeapon[] = [
      {
        name: "Sword",
        weaponType: "One-Handed Swords",
        baseDamage: 10,
        weight: 5.0,
        value: 100,
        enchantment: {
          name: "Fire",
          cost: 25,
          chargeAmount: 100,
          effects: [],
          costMethod: "auto",
        },
        globalFormId: "0x1",
        plugin: "Test.esp",
        keywords: ["Sword"],
        material: "Steel",
        isVendorItem: false,
        description: null,
        cannotDisenchant: false,
      },
      {
        name: "Bow",
        weaponType: "Bows",
        baseDamage: 8,
        weight: 3.0,
        value: 80,
        enchantment: {
          name: "Lightning",
          cost: 20,
          chargeAmount: 100,
          effects: [],
          costMethod: "auto",
        },
        globalFormId: "0x2",
        plugin: "Test.esp",
        keywords: ["Bow"],
        material: "Wood",
        isVendorItem: false,
        description: null,
        cannotDisenchant: false,
      },
    ];

    const result = groupWeaponsByCategory(mockWeapons);

    expect(result[0].categoryName).toBe("Bows");
    expect(result[1].categoryName).toBe("One-Handed Swords");
  });
});
