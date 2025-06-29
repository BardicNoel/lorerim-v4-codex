import { describe, it, expect } from "vitest";
import { resolveWeaponKeywordsAndMetadata } from "../logic/weaponMetadata.js";
import { generateMockData } from "./mockDataGenerator.js";

describe("weaponMetadata", () => {
  it("should resolve weapon keywords and metadata", () => {
    const mockData = generateMockData({
      weaponCount: 1,
      keywordCount: 2,
      weaponTypes: ["Sword"],
      materials: ["Steel"],
    });

    // Debug: Log the mock data to see what's being generated
    // (removed for clean test output)

    // Explicitly set KWDA to the correct FormIDs for this test
    const weapon = {
      ...mockData.weapons[0],
      data: {
        ...mockData.weapons[0].data,
        KWDA: mockData.keywords.map((k) => k.meta.globalFormId),
      },
    };

    const result = resolveWeaponKeywordsAndMetadata(weapon, mockData.keywords);

    console.log(`- Resolved keywords: ${result.keywords}`);
    console.log(`- Material: ${result.material}`);
    console.log(`- Is vendor item: ${result.isVendorItem}`);

    expect(result.keywords).toContain("WeapTypeSword");
    expect(result.material).toBe("Steel");
    expect(result.isVendorItem).toBe(false);
  });

  it("should handle weapons without keywords", () => {
    const mockData = generateMockData({
      weaponCount: 1,
      keywordCount: 0,
    });

    const weaponWithoutKeywords = {
      ...mockData.weapons[0],
      data: {
        ...mockData.weapons[0].data,
        KWDA: [],
      },
    };

    const result = resolveWeaponKeywordsAndMetadata(weaponWithoutKeywords, []);

    expect(result.keywords).toEqual([]);
    expect(result.material).toBeNull();
    expect(result.isVendorItem).toBe(false);
  });
});
