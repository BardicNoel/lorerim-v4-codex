import { createFileWriter } from "../fileWriter";
import { ParsedRecord } from "../../types";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { ProcessingStats } from "../stats";

// Mock fs promises
jest.mock("fs/promises", () => ({
  writeFile: jest.fn(),
  mkdir: jest.fn(),
}));

describe("FileWriter", () => {
  const testOutputDir = path.join(__dirname, "test-output");
  let fileWriter: ReturnType<typeof createFileWriter>;

  beforeEach(() => {
    fileWriter = createFileWriter();
    jest.clearAllMocks();
  });

  describe("writeRecords", () => {
    it("should create output directory if it does not exist", async () => {
      const records: Record<string, ParsedRecord[]> = {
        PERK: [
          {
            meta: { type: "PERK", formId: "00058F80", plugin: "test.esp" },
            data: {},
            header: "base64header",
          },
        ],
      };

      await fileWriter.writeRecords(records, testOutputDir);
      expect(mkdir).toHaveBeenCalledWith(testOutputDir, { recursive: true });
    });

    it("should write records to type-specific files", async () => {
      const records: Record<string, ParsedRecord[]> = {
        PERK: [
          {
            meta: { type: "PERK", formId: "00058F80", plugin: "test.esp" },
            data: { EDID: ["VGVzdFByZWs="] },
            header: "base64header",
          },
        ],
        RACE: [
          {
            meta: { type: "RACE", formId: "00058F81", plugin: "test.esp" },
            data: { EDID: ["VGVzdFJhY2U="] },
            header: "base64header",
          },
        ],
      };

      await fileWriter.writeRecords(records, testOutputDir);

      expect(writeFile).toHaveBeenCalledWith(
        path.join(testOutputDir, "PERK.json"),
        expect.any(String)
      );
      expect(writeFile).toHaveBeenCalledWith(
        path.join(testOutputDir, "RACE.json"),
        expect.any(String)
      );
    });

    it("should handle empty records object", async () => {
      await fileWriter.writeRecords({}, testOutputDir);
      expect(writeFile).not.toHaveBeenCalled();
    });
  });

  describe("writeStats", () => {
    it("should write stats to index.json", async () => {
      const stats: ProcessingStats = {
        totalRecords: 3,
        recordsByType: { PERK: 1, RACE: 2 },
        skippedRecords: 0,
        skippedTypes: new Set(),
        totalBytes: 1000,
        processingTime: 100,
        pluginsProcessed: 1,
        errors: {
          count: 0,
          types: {},
        },
      };

      await fileWriter.writeStats(stats, testOutputDir);
      expect(writeFile).toHaveBeenCalledWith(
        path.join(testOutputDir, "index.json"),
        expect.any(String)
      );
      // Parse the written string and check the object
      const writtenString = (writeFile as jest.Mock).mock.calls[0][1];
      const writtenObj = JSON.parse(writtenString);
      expect(writtenObj.stats.recordsByType).toEqual({ PERK: 1, RACE: 2 });
    });

    it("should include timestamp and record types in index.json", async () => {
      const stats: ProcessingStats = {
        totalRecords: 3,
        recordsByType: { PERK: 1, RACE: 2 },
        skippedRecords: 0,
        skippedTypes: new Set(),
        totalBytes: 1000,
        processingTime: 100,
        pluginsProcessed: 1,
        errors: {
          count: 0,
          types: {},
        },
      };

      await fileWriter.writeStats(stats, testOutputDir);

      const writeCall = (writeFile as jest.Mock).mock.calls[0];
      const writtenContent = JSON.parse(writeCall[1]);

      expect(writtenContent).toHaveProperty("timestamp");
      expect(writtenContent).toHaveProperty("recordTypes", ["PERK", "RACE"]);
      expect(writtenContent.stats.recordsByType).toEqual({ PERK: 1, RACE: 2 });
    });

    it("should handle empty stats object", async () => {
      const stats: ProcessingStats = {
        totalRecords: 0,
        recordsByType: {},
        skippedRecords: 0,
        skippedTypes: new Set(),
        totalBytes: 0,
        processingTime: 0,
        pluginsProcessed: 0,
        errors: {
          count: 0,
          types: {},
        },
      };

      await fileWriter.writeStats(stats, testOutputDir);

      const writeCall = (writeFile as jest.Mock).mock.calls[0];
      const writtenContent = JSON.parse(writeCall[1]);

      expect(writtenContent.stats.recordsByType).toEqual({});
      expect(writtenContent.recordTypes).toEqual([]);
    });
  });
});
