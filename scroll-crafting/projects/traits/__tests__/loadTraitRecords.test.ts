import { describe, expect, test } from "vitest";
import { loadTraitRecords } from "../logic/loadTraitRecords.js";
import type { SpelRecordFromSchema } from "../../../types/spelSchema.js";
import type { MgefRecordFromSchema } from "../../../types/mgefSchema.js";
import type { PerkRecordFromSchema } from "../../../types/perkSchema.js";

describe("loadTraitRecords", () => {
  test("should load and structure trait records", async () => {
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

    const mockPerk: PerkRecordFromSchema = {
      meta: {
        type: "PERK",
        formId: "0xFEDCBA",
        globalFormId: "0xFEDCBA",
        plugin: "Test.esp",
        isWinner: true
      },
      data: {
        EDID: "TEST_PERK",
        FULL: "Test Perk",
        DESC: "A test perk description",
        DATA: {
          isTrait: 1,
          level: 1,
          numRanks: 1,
          isPlayable: 1,
          isHidden: 0
        },
        sections: []
      }
    };

    const result = await loadTraitRecords();

    expect(result.spells).toHaveLength(1);
    expect(result.effects).toHaveLength(1);
    expect(result.perks).toHaveLength(1);

    const loadedSpell = result.spells[0];
    expect(loadedSpell.data.EDID).toBe("TEST_TRAIT_SPELL");
    expect(loadedSpell.meta.formId).toBe("0x123456");

    const loadedMgef = result.effects[0];
    expect(loadedMgef.data.EDID).toBe("TEST_MGEF");
    expect(loadedMgef.meta.formId).toBe("0x789ABC");

    const loadedPerk = result.perks[0];
    expect(loadedPerk.data.EDID).toBe("TEST_PERK");
    expect(loadedPerk.meta.formId).toBe("0xFEDCBA");
  });
}); 