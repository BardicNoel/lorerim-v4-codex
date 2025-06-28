import { describe, it, expect } from "vitest";
import {
  resolveEnchantedWeapons,
  groupWeaponsByCategory,
  type EnchantedWeapon,
} from "../logic/resolveEnchantedWeapons.js";

describe("resolveEnchantedWeapons", () => {
  const mockWeaponRecords = [
    {
      meta: {
        type: "WEAP",
        formId: "0x12345678",
        globalFormId: "0x12345678",
        plugin: "TestPlugin.esp",
        stackOrder: 0,
        isWinner: true,
      },
      data: {
        EDID: "TestSword",
        FULL: "Test Sword",
        DATA: {
          value: 100,
          weight: 5.0,
          damage: 10,
        },
        DNAM: {
          animationType: 1, // One-Handed Swords
          speed: 1.0,
          reach: 1.0,
          flags1: [],
          flags2: [],
        },
        EITM: "0x87654321", // Enchantment FormID
        EAMT: 100,
      },
    },
  ];

  const mockEnchantmentRecords = [
    {
      meta: {
        type: "ENCH",
        formId: "0x87654321",
        globalFormId: "0x87654321",
        plugin: "TestPlugin.esp",
        stackOrder: 0,
        isWinner: true,
      },
      data: {
        EDID: "TestEnchantment",
        FULL: "Fire Damage",
        ENIT: {
          enchantmentCost: 25,
          flags: [],
          castType: 0,
          chargeAmount: 100,
          enchantmentAmount: 1,
          enchantmentType: 0,
          chargeTime: 0,
          baseEnchantment: "",
          wornRestrictions: "",
        },
        EFID: "0x11111111", // Magic Effect FormID
        EFIT: {
          magnitude: 15,
          area: 0,
          duration: 0,
        },
      },
    },
  ];

  const mockMagicEffectRecords = [
    {
      meta: {
        type: "MGEF",
        formId: "0x11111111",
        globalFormId: "0x11111111",
        plugin: "TestPlugin.esp",
        stackOrder: 0,
        isWinner: true,
      },
      data: {
        EDID: "TestEffect",
        FULL: "Fire Damage",
        DESC: "Deals fire damage to target",
        DATA: {
          flags: [],
          baseCost: 25,
          relatedID: "",
          skill: 0,
          resistanceAV: null,
          skillLevel: 0,
          effectType: 0,
          primaryAV: null,
          secondAV: 0,
          perkID: "",
        },
        DNAM: "",
      },
    },
  ];

  it("should resolve weapon-enchantment-effect relationships", async () => {
    const result = await resolveEnchantedWeapons(
      mockWeaponRecords,
      mockEnchantmentRecords,
      mockMagicEffectRecords
    );

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      name: "Test Sword",
      weaponType: "One-Handed Swords",
      baseDamage: 10,
      weight: 5.0,
      value: 100,
      enchantment: {
        name: "Fire Damage",
        cost: 25,
        chargeAmount: 100,
        effects: [
          {
            name: "Fire Damage",
            magnitude: 15,
            duration: 0,
            area: 0,
            description: "Deals fire damage to target",
          },
        ],
      },
      globalFormId: "0x12345678",
      plugin: "TestPlugin.esp",
    });
  });

  it("should handle weapons without enchantments", async () => {
    const weaponsWithoutEnchantments = [
      {
        ...mockWeaponRecords[0],
        data: {
          ...mockWeaponRecords[0].data,
          EITM: undefined,
        },
      },
    ];

    const result = await resolveEnchantedWeapons(
      weaponsWithoutEnchantments,
      mockEnchantmentRecords,
      mockMagicEffectRecords
    );

    expect(result).toHaveLength(0);
  });

  it("should handle missing enchantment records", async () => {
    const result = await resolveEnchantedWeapons(
      mockWeaponRecords,
      [], // Empty enchantment records
      mockMagicEffectRecords
    );

    expect(result).toHaveLength(0);
  });

  it("should handle missing magic effect records", async () => {
    const result = await resolveEnchantedWeapons(
      mockWeaponRecords,
      mockEnchantmentRecords,
      [] // Empty magic effect records
    );

    expect(result).toHaveLength(0);
  });

  it("should categorize weapons correctly", async () => {
    const weaponsWithDifferentTypes = [
      {
        ...mockWeaponRecords[0],
        data: {
          ...mockWeaponRecords[0].data,
          DNAM: {
            ...mockWeaponRecords[0].data.DNAM,
            animationType: 2, // One-Handed Daggers
          },
        },
      },
      {
        ...mockWeaponRecords[0],
        meta: {
          ...mockWeaponRecords[0].meta,
          formId: "0x22222222",
          globalFormId: "0x22222222",
        },
        data: {
          ...mockWeaponRecords[0].data,
          EDID: "TestDagger",
          FULL: "Test Dagger",
          DNAM: {
            ...mockWeaponRecords[0].data.DNAM,
            animationType: 7, // Bows
          },
        },
      },
    ];

    const result = await resolveEnchantedWeapons(
      weaponsWithDifferentTypes,
      mockEnchantmentRecords,
      mockMagicEffectRecords
    );

    expect(result).toHaveLength(2);
    expect(result[0].weaponType).toBe("One-Handed Daggers");
    expect(result[1].weaponType).toBe("Bows");
  });
});

describe("groupWeaponsByCategory", () => {
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
        },
        globalFormId: "0x1",
        plugin: "Test.esp",
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
        },
        globalFormId: "0x2",
        plugin: "Test.esp",
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
        },
        globalFormId: "0x3",
        plugin: "Test.esp",
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
        },
        globalFormId: "0x1",
        plugin: "Test.esp",
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
        },
        globalFormId: "0x2",
        plugin: "Test.esp",
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
        },
        globalFormId: "0x1",
        plugin: "Test.esp",
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
        },
        globalFormId: "0x2",
        plugin: "Test.esp",
      },
    ];

    const result = groupWeaponsByCategory(mockWeapons);

    expect(result[0].categoryName).toBe("Bows");
    expect(result[1].categoryName).toBe("One-Handed Swords");
  });
});
