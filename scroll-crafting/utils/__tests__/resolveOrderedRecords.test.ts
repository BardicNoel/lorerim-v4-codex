import { describe, it, expect, vi, beforeEach, afterAll } from "vitest";
import { resolveOrderedRecords } from "../resolveOrderedRecords.js";

// Mock console.log to avoid noise in tests
const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

describe("resolveOrderedRecords", () => {
  beforeEach(() => {
    consoleSpy.mockClear();
  });

  afterAll(() => {
    consoleSpy.mockRestore();
  });

  it("should resolve records in the order specified by FLST LNAM array", () => {
    const flstRecord = {
      meta: {
        type: "FLST",
        formId: "0xFE260E91",
        globalFormId: "0xFE260E91",
        plugin: "Test.esp",
      },
      data: {
        EDID: "TestFormList",
        LNAM: ["0x2C123456", "0x2C678901", "0x2C999999"],
      },
    };

    const targetRecords = [
      {
        meta: {
          type: "PERK",
          formId: "0x678901",
          globalFormId: "0x2C678901",
          plugin: "Test.esp",
        },
        data: {
          EDID: "Perk02",
          FULL: "Perk 2",
        },
      },
      {
        meta: {
          type: "PERK",
          formId: "0x123456",
          globalFormId: "0x2C123456",
          plugin: "Test.esp",
        },
        data: {
          EDID: "Perk01",
          FULL: "Perk 1",
        },
      },
    ];

    const mockFindByFormId = vi.fn((records: any[], formId: string) => {
      return records.find((r: any) => r.meta.globalFormId === formId) || null;
    });

    const result = resolveOrderedRecords(flstRecord, targetRecords, mockFindByFormId);

    expect(result).toHaveLength(2);
    expect(result[0].data.EDID).toBe("Perk01"); // First in LNAM order
    expect(result[1].data.EDID).toBe("Perk02"); // Second in LNAM order
    expect(mockFindByFormId).toHaveBeenCalledTimes(3);
  });

  it("should return empty array when FLST has no LNAM data", () => {
    const flstRecord = {
      meta: {
        type: "FLST",
        formId: "0xFE260E91",
        globalFormId: "0xFE260E91",
        plugin: "Test.esp",
      },
      data: {
        EDID: "TestFormList",
        LNAM: [] as string[], // Empty array instead of undefined
      },
    };

    const targetRecords: any[] = [];
    const mockFindByFormId = vi.fn();

    const result = resolveOrderedRecords(flstRecord, targetRecords, mockFindByFormId);

    expect(result).toHaveLength(0);
    expect(mockFindByFormId).not.toHaveBeenCalled();
  });

  it("should handle missing records gracefully", () => {
    const flstRecord = {
      meta: {
        type: "FLST",
        formId: "0xFE260E91",
        globalFormId: "0xFE260E91",
        plugin: "Test.esp",
      },
      data: {
        EDID: "TestFormList",
        LNAM: ["0x2C123456", "0x2C678901", "0x2C999999"],
      },
    };

    const targetRecords = [
      {
        meta: {
          type: "PERK",
          formId: "0x123456",
          globalFormId: "0x2C123456",
          plugin: "Test.esp",
        },
        data: {
          EDID: "Perk01",
          FULL: "Perk 1",
        },
      },
    ];

    const mockFindByFormId = vi.fn((records: any[], formId: string) => {
      return records.find((r: any) => r.meta.globalFormId === formId) || null;
    });

    const result = resolveOrderedRecords(flstRecord, targetRecords, mockFindByFormId);

    expect(result).toHaveLength(1);
    expect(result[0].data.EDID).toBe("Perk01");
    expect(mockFindByFormId).toHaveBeenCalledTimes(3);
  });

  it("should log appropriate debug information", () => {
    const flstRecord = {
      meta: {
        type: "FLST",
        formId: "0xFE260E91",
        globalFormId: "0xFE260E91",
        plugin: "Test.esp",
      },
      data: {
        EDID: "TestFormList",
        LNAM: ["0x2C123456"],
      },
    };

    const targetRecords = [
      {
        meta: {
          type: "PERK",
          formId: "0x123456",
          globalFormId: "0x2C123456",
          plugin: "Test.esp",
        },
        data: {
          EDID: "Perk01",
          FULL: "Perk 1",
        },
      },
    ];

    const mockFindByFormId = vi.fn((records: any[], formId: string) => {
      return records.find((r: any) => r.meta.globalFormId === formId) || null;
    });

    resolveOrderedRecords(flstRecord, targetRecords, mockFindByFormId);

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("resolveOrderedRecords: Resolving 1 records from FLST TestFormList")
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("✅ Found record for FormID 0x2C123456: Perk01")
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("📊 Resolved 1 out of 1 records")
    );
  });
}); 