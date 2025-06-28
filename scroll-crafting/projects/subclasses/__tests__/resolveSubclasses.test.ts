import { describe, it, expect, vi, beforeEach, afterAll } from "vitest";
import { resolveSubclasses } from "../logic/resolveSubclasses.js";
import { FlstRecordFromSchema } from "../../../types/flstSchema.js";
import { PerkRecordFromSchema } from "../../../types/perkSchema.js";

// Mock console.log to avoid noise in tests
const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

describe("resolveSubclasses", () => {
  beforeEach(() => {
    consoleSpy.mockClear();
  });

  afterAll(() => {
    consoleSpy.mockRestore();
  });

  it("should return an array of subclasses from FLST and perks", async () => {
    const flstRecord: FlstRecordFromSchema = {
      meta: {
        type: "FLST",
        formId: "0x00001234",
        globalFormId: "0x00001234",
        plugin: "TestPlugin.esp",
        stackOrder: 0,
        isWinner: true,
      },
      data: {
        EDID: "TestFormList",
        LNAM: ["0x00005678", "0x00009ABC"],
      },
    };

    const perkRecords: PerkRecordFromSchema[] = [
      {
        meta: {
          type: "PERK",
          formId: "0x00005678",
          globalFormId: "0x00005678",
          plugin: "TestPlugin.esp",
          stackOrder: 0,
          isWinner: true,
        },
        data: {
          EDID: "TestPerk1",
          FULL: "Test Perk 1",
          DESC: "Test description 1",
          DATA: {
            isTrait: 0,
            level: 1,
            numRanks: 1,
            isPlayable: 1,
            isHidden: 0,
          },
          sections: [],
        },
      },
      {
        meta: {
          type: "PERK",
          formId: "0x00009ABC",
          globalFormId: "0x00009ABC",
          plugin: "TestPlugin.esp",
          stackOrder: 0,
          isWinner: true,
        },
        data: {
          EDID: "TestPerk2",
          FULL: "Test Perk 2",
          DESC: "Test description 2",
          DATA: {
            isTrait: 0,
            level: 1,
            numRanks: 1,
            isPlayable: 1,
            isHidden: 0,
          },
          sections: [],
        },
      },
    ];

    const result = await resolveSubclasses(flstRecord, perkRecords);

    expect(result).toHaveLength(2);
    expect(result[0].name).toBe("Test Perk 1");
    expect(result[0].description).toBe("Test description 1");
    expect(result[0].prerequisites).toEqual([]);
    expect(result[1].name).toBe("Test Perk 2");
    expect(result[1].description).toBe("Test description 2");
    expect(result[1].prerequisites).toEqual([]);
  });

  it("should handle missing FLST data gracefully", async () => {
    const flstRecord: FlstRecordFromSchema = {
      meta: {
        type: "FLST",
        formId: "0xFE260E91",
        globalFormId: "0xFE260E91",
        plugin: "SubclassesOfSkyrim.esp",
        isWinner: true,
        stackOrder: 1,
      },
      data: {
        EDID: "DAR_DestinyFormList",
        LNAM: [], // Empty LNAM
      },
    };

    const perks: PerkRecordFromSchema[] = [];
    const result = await resolveSubclasses(flstRecord, perks);

    expect(result).toHaveLength(0);
  });

  it("should handle missing perks gracefully", async () => {
    const flstRecord: FlstRecordFromSchema = {
      meta: {
        type: "FLST",
        formId: "0xFE260E91",
        globalFormId: "0xFE260E91",
        plugin: "SubclassesOfSkyrim.esp",
        isWinner: true,
        stackOrder: 1,
      },
      data: {
        EDID: "DAR_DestinyFormList",
        LNAM: ["0xFE260808", "0xFE26080A"],
      },
    };

    const perks: PerkRecordFromSchema[] = []; // Empty perks array

    const result = await resolveSubclasses(flstRecord, perks);

    expect(result).toHaveLength(0);
  });
});
