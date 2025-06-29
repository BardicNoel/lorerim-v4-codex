import { describe, it, expect } from "vitest";
import { processEnchantment } from "../logic/enchantmentProcessor.js";
import { generateMockData } from "./mockDataGenerator.js";
import { MgefRecordFromSchema } from "../../../types/mgefSchema.js";

describe("enchantmentProcessor", () => {
  it("should process enchantment with single effect", async () => {
    const mockData = generateMockData({
      enchantmentCount: 1,
      magicEffectCount: 1,
      enchantmentTypes: ["Fire Damage"],
    });

    // Build mgefMap
    const mgefMap = new Map<string, MgefRecordFromSchema>();
    for (const mgef of mockData.magicEffects) {
      mgefMap.set(mgef.meta.globalFormId.toLowerCase(), mgef);
    }

    const result = await processEnchantment(mockData.enchantments[0], mgefMap);

    expect(result).not.toBeNull();
    expect(result!.name).toBe("Fire Damage Enchantment");
    expect(result!.cost).toBeGreaterThan(0);
    expect(result!.chargeAmount).toBeGreaterThan(0);
    expect(result!.effects).toHaveLength(1);
    expect(result!.effects[0].name).toBe("Fire Damage");
  });

  it("should handle missing magic effects", async () => {
    const mockData = generateMockData({
      enchantmentCount: 1,
      magicEffectCount: 0, // No magic effects
      enchantmentTypes: ["Fire Damage"],
    });

    // Build empty mgefMap
    const mgefMap = new Map<string, MgefRecordFromSchema>();

    const result = await processEnchantment(mockData.enchantments[0], mgefMap);

    expect(result).not.toBeNull();
    expect(result!.effects).toHaveLength(1);
    expect(result!.effects[0].name).toBe("Unknown Effect");
  });

  it("should calculate enchantment cost correctly", async () => {
    const mockData = generateMockData({
      enchantmentCount: 1,
      magicEffectCount: 1,
      enchantmentTypes: ["Fire Damage"],
    });

    // Build mgefMap
    const mgefMap = new Map<string, MgefRecordFromSchema>();
    for (const mgef of mockData.magicEffects) {
      mgefMap.set(mgef.meta.globalFormId.toLowerCase(), mgef);
    }

    const result = await processEnchantment(mockData.enchantments[0], mgefMap);

    expect(result).not.toBeNull();
    expect(result!.cost).toBeGreaterThan(0);
    expect(result!.costMethod).toBe("manual"); // Since we set ManualCalc flag in mock data
  });

  it("should return null when no valid effects found", async () => {
    const mockData = generateMockData({
      enchantmentCount: 1,
      magicEffectCount: 0, // No magic effects
    });

    // Build empty mgefMap
    const mgefMap = new Map<string, MgefRecordFromSchema>();

    const result = await processEnchantment(mockData.enchantments[0], mgefMap);
    expect(result).toBeNull();
  });

  it("should handle enchantment with missing magic effect", async () => {
    const mockData = generateMockData({
      enchantmentCount: 1,
      magicEffectCount: 1,
    });

    // Build mgefMap
    const mgefMap = new Map<string, MgefRecordFromSchema>();
    for (const mgef of mockData.magicEffects) {
      mgefMap.set(mgef.meta.globalFormId.toLowerCase(), mgef);
    }

    // Use a non-existent magic effect FormID
    const enchantmentWithInvalidEffect = {
      ...mockData.enchantments[0],
      data: {
        ...mockData.enchantments[0].data,
        effects: [
          {
            EFID: "0x99999999", // Non-existent FormID
            EFIT: {
              magnitude: 10,
              area: 0,
              duration: 0,
            },
          },
        ],
      },
    };

    const result = await processEnchantment(
      enchantmentWithInvalidEffect,
      mgefMap
    );
    expect(result).toBeNull();
  });
});
