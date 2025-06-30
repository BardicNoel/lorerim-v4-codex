import { describe, expect, test } from "vitest";
import { resolveTraits, resolveSpellTrait } from "../logic/resolveTraits.js";
import type { SpelRecordFromSchema } from "../../../types/spelSchema.js";
import type { MgefRecordFromSchema } from "../../../types/mgefSchema.js";

describe("resolveTraits", () => {
  const mockSpell: SpelRecordFromSchema = {
    meta: {
      type: "SPEL",
      formId: "0x123456",
      globalFormId: "0x123456",
      plugin: "Test.esp",
      isWinner: true
    },
    data: {
      EDID: "TEST_TRAIT_SPELL",
      FULL: "Test Trait",
      DESC: "A test trait description",
      ETYP: "",
      SPIT: {
        type: "Spell",
        spellCost: 100,
        flags: ["No Auto Calc"],
        chargeTime: 0,
        castType: "FireAndForget",
        delivery: "Self",
        castDuration: 0,
        range: 0,
        halfCostPerk: ""
      },
      effects: [
        {
          EFID: "0x789ABC",
          EFIT: {
            magnitude: 1.5,
            area: 0,
            duration: 0
          }
        }
      ]
    }
  };

  const mockMgef: MgefRecordFromSchema = {
    meta: {
      type: "MGEF",
      formId: "0x789ABC",
      globalFormId: "0x789ABC",
      plugin: "Test.esp",
      isWinner: true
    },
    data: {
      EDID: "TEST_MGEF",
      FULL: "Test Magic Effect",
      DATA: {
        flags: ["Detrimental"],
        castType: "FireAndForget",
        area: 0,
        baseCost: 100,
        relatedID: "",
        skill: "Alteration",
        resistanceAV: null,
        effectType: "Value Modifier",
        primaryAV: {
          type: "Attribute",
          formId: "0xDEF123",
          name: "Health",
          effect: "Modifies health regeneration"
        },
        secondAV: {
          type: "Attribute",
          formId: "0xDEF124",
          name: "Magicka",
          effect: "Modifies magicka regeneration"
        },
        perkID: "0xFEDCBA",
        skillLevel: 0,
        castingTime: 0,
        deliveryType: "Self"
      },
      DNAM: "A test magic effect"
    }
  };

  const getMgef = (formId: string): MgefRecordFromSchema => {
    if (formId === "0x789ABC") return mockMgef;
    throw new Error(`Unknown MGEF: ${formId}`);
  };

  test("should resolve a single trait", () => {
    const result = resolveSpellTrait(mockSpell, getMgef);
    expect(result).toBeDefined();
    expect(result.name).toBe("Test Trait");
    expect(result.edid).toBe("TEST_TRAIT_SPELL");
    expect(result.formId).toBe("0x123456");
    expect(result.effects).toHaveLength(1);
  });

  test("should resolve multiple traits", () => {
    const result = resolveTraits([mockSpell], getMgef);
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(1);

    const trait = result[0];
    expect(trait.name).toBe("Test Trait");
    expect(trait.edid).toBe("TEST_TRAIT_SPELL");
    expect(trait.formId).toBe("0x123456");
    expect(trait.effects).toHaveLength(1);
  });
}); 