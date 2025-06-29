import { describe, it, expect, vi, beforeEach } from "vitest";
import { loadTraitRecords } from "../logic/loadTraitRecords.js";
import { loadRecordSet } from "../../../utils/loadRecordSet.js";
import { findByFormId } from "../../../utils/findByFormId.js";
import { getMgefRecordsForSpell } from "../../../utils/index.js";
import type { FlstRecordFromSchema } from "../../../types/flstSchema.js";
import type { PerkRecordFromSchema } from "../../../types/perkSchema.js";
import type { SpelRecordFromSchema } from "../../../types/spelSchema.js";
import type { MgefRecordFromSchema } from "../../../types/mgefSchema.js";
import type { PrimaryRecordFromSchema } from "../../../types/recordSchema.js";

// Mock the loadRecordSet utility
vi.mock("../../../utils/loadRecordSet.js");
vi.mock("../../../utils/findByFormId.js");

// Generic type for records with meta.globalFormId
type RecordWithFormId = {
  meta: {
    globalFormId: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

describe("loadTraitRecords", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should load and resolve trait records correctly", async () => {
    // Mock form list record
    const mockFormList: FlstRecordFromSchema = {
      meta: {
        globalFormId: "0xFEA76002",
        type: "FLST",
        formId: "0xFEA76002",
        plugin: "Test.esp",
        stackOrder: null,
        isWinner: true
      },
      data: {
        EDID: "Traits_AbilityList",
        LNAM: ["0x123456", "0x789ABC"],
      },
    };

    // Mock perk records
    const mockPerks: PerkRecordFromSchema[] = [
      {
        meta: {
          globalFormId: "0x123456",
          type: "PERK",
          formId: "0x123456",
          plugin: "LoreRim Traits.esp",
          stackOrder: null,
          isWinner: true
        },
        data: {
          EDID: "Trait_Perk_1",
          FULL: "Test Trait 1",
          DESC: "Test Description 1",
          DATA: {
            isTrait: 1,
            level: 1,
            numRanks: 1,
            isPlayable: 1,
            isHidden: 0
          },
          sections: [
            {
              PRKE: {
                sectionType: "EPFT",
                rank: 0,
                priority: 0
              },
              DATA: {
                spellId: "0xABCDEF",
              },
              PRKF: "PRKF_Test"
            },
          ],
        },
      },
      {
        meta: {
          globalFormId: "0x789ABC",
          type: "PERK",
          formId: "0x789ABC",
          plugin: "LoreRim Traits.esp",
          stackOrder: null,
          isWinner: true
        },
        data: {
          EDID: "Trait_Perk_2",
          FULL: "Test Trait 2",
          DESC: "Test Description 2",
          DATA: {
            isTrait: 1,
            level: 1,
            numRanks: 1,
            isPlayable: 1,
            isHidden: 0
          },
          sections: [
            {
              PRKE: {
                sectionType: "EPFT",
                rank: 0,
                priority: 0
              },
              DATA: {
                spellId: "0x123DEF",
              },
              PRKF: "PRKF_Test"
            },
          ],
        },
      },
    ];

    // Mock spell records
    const mockSpells: SpelRecordFromSchema[] = [
      {
        meta: {
          globalFormId: "0xABCDEF",
          type: "SPEL",
          formId: "0xABCDEF",
          plugin: "Test.esp",
          stackOrder: null,
          isWinner: true
        },
        data: {
          EDID: "Trait_Spell_1",
          FULL: "Test Spell 1",
          ETYP: "ETYP_Test",
          DESC: "Test Spell Description 1",
          SPIT: {
            spellCost: 0,
            flags: [],
            type: "Ability",
            chargeTime: 0,
            castType: "Constant",
            delivery: "Self",
            castDuration: 0,
            range: 0,
            halfCostPerk: "0x000000"
          },
          effects: [
            {
              EFID: "0xEFEFEF",
              EFIT: {
                magnitude: 1,
                area: 0,
                duration: 0
              }
            },
          ],
        },
      },
      {
        meta: {
          globalFormId: "0x123DEF",
          type: "SPEL",
          formId: "0x123DEF",
          plugin: "Test.esp",
          stackOrder: null,
          isWinner: true
        },
        data: {
          EDID: "Trait_Spell_2",
          FULL: "Test Spell 2",
          ETYP: "ETYP_Test",
          DESC: "Test Spell Description 2",
          SPIT: {
            spellCost: 0,
            flags: [],
            type: "Ability",
            chargeTime: 0,
            castType: "Constant",
            delivery: "Self",
            castDuration: 0,
            range: 0,
            halfCostPerk: "0x000000"
          },
          effects: [
            {
              EFID: "0xFEFEFE",
              EFIT: {
                magnitude: 1,
                area: 0,
                duration: 0
              }
            },
          ],
        },
      },
    ];

    // Mock magic effect records
    const mockMgefs: MgefRecordFromSchema[] = [
      {
        meta: {
          globalFormId: "0xEFEFEF",
          type: "MGEF",
          formId: "0xEFEFEF",
          plugin: "Test.esp",
          stackOrder: null,
          isWinner: true
        },
        data: {
          EDID: "Trait_Effect_1",
          FULL: "Test Effect 1",
          DATA: {
            flags: [],
            baseCost: 0,
            relatedID: "0x000000",
            skill: 0,
            resistanceAV: null,
            skillLevel: 0,
            effectType: 0,
            primaryAV: null,
            secondAV: 0,
            perkID: "0x000000"
          },
          DNAM: "Test Effect Description 1"
        },
      },
      {
        meta: {
          globalFormId: "0xFEFEFE",
          type: "MGEF",
          formId: "0xFEFEFE",
          plugin: "Test.esp",
          stackOrder: null,
          isWinner: true
        },
        data: {
          EDID: "Trait_Effect_2",
          FULL: "Test Effect 2",
          DATA: {
            flags: [],
            baseCost: 0,
            relatedID: "0x000000",
            skill: 0,
            resistanceAV: null,
            skillLevel: 0,
            effectType: 0,
            primaryAV: null,
            secondAV: 0,
            perkID: "0x000000"
          },
          DNAM: "Test Effect Description 2"
        },
      },
    ];

    // Set up mocks
    vi.mocked(loadRecordSet).mockImplementation(async (tag: string) => {
      switch (tag) {
        case "flst":
          return [mockFormList];
        case "perk":
          return mockPerks;
        case "spel":
          return mockSpells;
        case "mgef":
          return mockMgefs;
        default:
          return [];
      }
    });

    // Mock findByFormId to return records based on formId
    vi.mocked(findByFormId).mockImplementation((records, formId) => {
      return records.find(r => r.meta?.globalFormId === formId) || null;
    });

    // Execute test
    const result = await loadTraitRecords();

    // Verify results
    expect(result.perks).toHaveLength(2);
    expect(result.spells).toHaveLength(2);
    expect(result.mgefs).toHaveLength(2);

    // Verify loadRecordSet was called correctly
    expect(loadRecordSet).toHaveBeenCalledWith("flst", expect.any(String), expect.any(String));
    expect(loadRecordSet).toHaveBeenCalledWith("perk", expect.any(String), expect.any(String));
    expect(loadRecordSet).toHaveBeenCalledWith("spel", expect.any(String), expect.any(String));
    expect(loadRecordSet).toHaveBeenCalledWith("mgef", expect.any(String), expect.any(String));
  });

  it("should throw error if traits form list is not found", async () => {
    // Mock empty form list records
    vi.mocked(loadRecordSet).mockResolvedValue([]);

    // Execute and verify error
    await expect(loadTraitRecords()).rejects.toThrow(
      "Could not find traits form list with ID 0xFEA76002"
    );
  });
}); 