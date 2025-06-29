import { describe, expect, it } from "vitest";
import { resolveTrait, resolveTraits } from "../logic/resolveTraits.js";

describe("resolveTrait", () => {
  const mockPerk = {
    meta: {
      globalFormId: "0x123456"
    },
    data: {
      EDID: "TEST_Trait_01",
      FULL: "Test Trait",
      DESC: "A test trait description",
      DATA: {
        isTrait: 1
      },
      sections: [
        {
          DATA: {
            spellId: "0x789ABC"
          }
        }
      ]
    }
  };

  const mockSpell = {
    data: {
      effects: [
        {
          EFID: "0xDEF123",
          EFIT: {
            magnitude: 50,
            duration: 30,
            area: 0
          }
        }
      ]
    }
  };

  const mockMgef = {
    data: {
      DNAM: "Increases strength by <mag> points for <dur> seconds"
    }
  };

  it("resolves a trait with spell effects", () => {
    const result = resolveTrait(
      mockPerk as any,
      [mockSpell as any],
      [mockMgef as any]
    );

    expect(result).toEqual({
      name: "Test Trait",
      description: "A test trait description",
      effects: ["Increases strength by 50 points for 30 seconds"],
      edid: "TEST_Trait_01",
      formId: "0x123456"
    });
  });

  it("handles missing spell references gracefully", () => {
    const perkWithoutSpell = {
      ...mockPerk,
      data: {
        ...mockPerk.data,
        sections: [{ DATA: {} }]
      }
    };

    const result = resolveTrait(
      perkWithoutSpell as any,
      [mockSpell as any],
      [mockMgef as any]
    );

    expect(result.effects).toHaveLength(0);
  });
});

describe("resolveTraits", () => {
  const mockPerks = [
    {
      meta: { globalFormId: "0x1" },
      data: {
        EDID: "TRAIT_01",
        FULL: "Trait A",
        DESC: "Description A",
        DATA: { isTrait: 1 },
        sections: []
      }
    },
    {
      meta: { globalFormId: "0x2" },
      data: {
        EDID: "PERK_02",
        FULL: "Not A Trait",
        DESC: "Description B",
        DATA: { isTrait: 0 },
        sections: []
      }
    },
    {
      meta: { globalFormId: "0x3" },
      data: {
        EDID: "TRAIT_03",
        FULL: "Trait B",
        DESC: "Description C",
        DATA: { isTrait: 1 },
        sections: []
      }
    }
  ];

  it("filters and sorts traits correctly", () => {
    const result = resolveTraits(
      mockPerks as any,
      [],
      []
    );

    expect(result).toHaveLength(2);
    expect(result[0].name).toBe("Trait A");
    expect(result[1].name).toBe("Trait B");
  });
}); 