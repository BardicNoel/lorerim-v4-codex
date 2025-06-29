import { describe, it, expect } from "vitest";
import { determineWeaponType } from "../logic/weaponTypeDetection.js";
import { generateMockData } from "./mockDataGenerator.js";

describe("weaponTypeDetection", () => {
  it("should determine weapon type from keywords", () => {
    const mockData = generateMockData({
      weaponCount: 1,
      keywordCount: 2,
      weaponTypes: ["Sword"],
      materials: ["Steel"],
    });

    const weaponType = determineWeaponType(
      mockData.weapons[0],
      mockData.keywords
    );
    expect(weaponType).toBe("One-Handed Swords");
  });

  it("should fallback to animation type when no keywords found", () => {
    const mockData = generateMockData({
      weaponCount: 1,
      keywordCount: 0,
    });

    // Remove keywords from weapon
    const weaponWithoutKeywords = {
      ...mockData.weapons[0],
      data: {
        ...mockData.weapons[0].data,
        KWDA: [],
      },
    };

    const weaponType = determineWeaponType(weaponWithoutKeywords, []);
    expect(weaponType).toBe("One-Handed Swords"); // Based on animationType: 1
  });

  it("should handle different animation types", () => {
    const mockData = generateMockData({
      weaponCount: 3,
      keywordCount: 0,
    });

    // Test different animation types
    const weapon1 = {
      ...mockData.weapons[0],
      data: {
        ...mockData.weapons[0].data,
        DNAM: { ...mockData.weapons[0].data.DNAM, animationType: 2 },
      },
    };
    const weapon2 = {
      ...mockData.weapons[1],
      data: {
        ...mockData.weapons[1].data,
        DNAM: { ...mockData.weapons[1].data.DNAM, animationType: 7 },
      },
    };

    expect(determineWeaponType(weapon1, [])).toBe("One-Handed Daggers");
    expect(determineWeaponType(weapon2, [])).toBe("Bows");
  });
});
