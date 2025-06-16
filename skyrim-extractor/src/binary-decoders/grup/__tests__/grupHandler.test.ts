import { Buffer } from "buffer";
import { StatsCollector } from "../../../utils/stats";
import { ProcessedRecordType } from "../../../constants";
import { RECORD_HEADER } from "../../buffer.constants";
import {
  processGRUP,
  processNestedGRUP,
  parseGRUPHeader,
  validateGRUPSize,
} from "../grupHandler";
import * as fs from "fs";
import * as path from "path";

// Mock the debug log functions
jest.mock("../grupUtils", () => ({
  debugLog: jest.fn(),
  errorLog: jest.fn(),
  getGroupTypeName: jest.fn(),
}));

// Mock fs for dumpGrupToFile and readFileSync
jest.mock("fs", () => ({
  appendFileSync: jest.fn(),
  readFileSync: jest.fn().mockImplementation(() => {
    // Return a buffer with the mock data
    const buffer = Buffer.alloc(1000);

    // MGEF GRUP
    buffer.write("GRUP", 0);
    buffer.writeUInt32LE(200, 4);
    buffer.writeUInt32LE(0, 8);
    buffer.write("MGEF", 12);
    buffer.writeUInt32LE(1234567890, 16);
    buffer.writeUInt32LE(0, 20);

    // MGEF record
    buffer.write("MGEF", 24);
    buffer.writeUInt32LE(40, 28);
    buffer.writeUInt32LE(0x12345678, 32);
    buffer.writeUInt32LE(0xabcdef01, 36);

    // SPEL GRUP
    buffer.write("GRUP", 200);
    buffer.writeUInt32LE(200, 204);
    buffer.writeUInt32LE(0, 208);
    buffer.write("SPEL", 212);
    buffer.writeUInt32LE(1234567890, 216);
    buffer.writeUInt32LE(0, 220);

    // SPEL record
    buffer.write("SPEL", 224);
    buffer.writeUInt32LE(40, 228);
    buffer.writeUInt32LE(0x12345678, 232);
    buffer.writeUInt32LE(0xabcdef01, 236);

    // PERK GRUP
    buffer.write("GRUP", 400);
    buffer.writeUInt32LE(200, 404);
    buffer.writeUInt32LE(0, 408);
    buffer.write("PERK", 412);
    buffer.writeUInt32LE(1234567890, 416);
    buffer.writeUInt32LE(0, 420);

    // PERK record
    buffer.write("PERK", 424);
    buffer.writeUInt32LE(40, 428);
    buffer.writeUInt32LE(0x12345678, 432);
    buffer.writeUInt32LE(0xabcdef01, 436);

    return buffer;
  }),
}));

describe("grupHandler", () => {
  let statsCollector: StatsCollector;
  const pluginName = "test.esp";
  let mockBuffer: Buffer;

  beforeEach(() => {
    statsCollector = new StatsCollector();
    jest.clearAllMocks();

    // Read the mock file
    const mockPath = path.join(
      __dirname,
      "../__mock__/wsn-skillrate-alternative.mock.esp"
    );
    mockBuffer = fs.readFileSync(mockPath);
  });

  describe("processGRUP", () => {
    it("should process a valid GRUP with supported record type", () => {
      // Find the MGEF GRUP in the buffer
      const mgefOffset = mockBuffer.indexOf("GRUP");
      const records = processGRUP(
        mockBuffer,
        mgefOffset,
        pluginName,
        statsCollector
      );

      expect(records.length).toBeGreaterThan(0);
      expect(records[0].meta.type).toBe("MGEF");
    });

    it("should skip GRUP with unsupported record type", () => {
      // Create a buffer with an unsupported type
      const buffer = Buffer.alloc(100);
      buffer.write("GRUP", 0);
      buffer.writeUInt32LE(60, 4);
      buffer.writeUInt32LE(0, 8);
      buffer.write("TEST", 12); // unsupported type
      buffer.writeUInt32LE(1234567890, 16);
      buffer.writeUInt32LE(0, 20);

      const records = processGRUP(buffer, 0, pluginName, statsCollector);

      expect(records).toHaveLength(0);
      const stats = statsCollector.getStats();
      expect(stats.skippedByType["TEST"]).toBe(1);
    });

    it("should handle nested GRUPs", () => {
      // Find the SPEL GRUP in the buffer
      const spelOffset = mockBuffer.indexOf("GRUP", mockBuffer.indexOf("SPEL"));
      const records = processGRUP(
        mockBuffer,
        spelOffset,
        pluginName,
        statsCollector
      );

      expect(records.length).toBeGreaterThan(0);
      expect(records[0].meta.type).toBe("SPEL");
    });

    it("should handle errors gracefully", () => {
      const buffer = Buffer.alloc(20); // Too small for a valid GRUP

      expect(() => processGRUP(buffer, 0, pluginName, statsCollector)).toThrow(
        "Failed to process GRUP"
      );
    });
  });

  describe("processNestedGRUP", () => {
    it("should process nested GRUP with valid records", () => {
      // Find the PERK GRUP in the buffer
      const perkOffset = mockBuffer.indexOf("GRUP", mockBuffer.indexOf("PERK"));
      const records = processNestedGRUP(
        mockBuffer,
        perkOffset,
        pluginName,
        statsCollector
      );

      expect(records.length).toBeGreaterThan(0);
      expect(records[0].meta.type).toBe("PERK");
    });

    it("should handle truncated GRUP data", () => {
      const buffer = Buffer.alloc(100);

      // GRUP header
      buffer.write("GRUP", 0);
      buffer.writeUInt32LE(200, 4); // Size larger than buffer
      buffer.writeUInt32LE(0, 8);
      buffer.write("SPEL", 12);
      buffer.writeUInt32LE(1234567890, 16);
      buffer.writeUInt32LE(0, 20);

      const records = processNestedGRUP(buffer, 0, pluginName, statsCollector);

      expect(records).toHaveLength(0);
      const stats = statsCollector.getStats();
      expect(stats.errors.types["MaxIterationsExceeded_SPEL"]).toBe(1);
    });

    it("should skip unsupported record types in nested GRUP", () => {
      const buffer = Buffer.alloc(100);

      // GRUP header
      buffer.write("GRUP", 0);
      buffer.writeUInt32LE(60, 4);
      buffer.writeUInt32LE(0, 8);
      buffer.write("SPEL", 12);
      buffer.writeUInt32LE(1234567890, 16);
      buffer.writeUInt32LE(0, 20);

      // Unsupported record
      buffer.write("TEST", 24);
      buffer.writeUInt32LE(40, 28);
      buffer.writeUInt32LE(0x12345678, 32);
      buffer.writeUInt32LE(0xabcdef01, 36);

      const records = processNestedGRUP(buffer, 0, pluginName, statsCollector);

      expect(records).toHaveLength(0);
      const stats = statsCollector.getStats();
      expect(stats.skippedByType["TEST"]).toBe(1);
    });
  });

  describe("parseGrupHeaderInfo", () => {
    it("should parse valid GRUP header info", () => {
      // Find the MGEF GRUP in the buffer
      const mgefOffset = mockBuffer.indexOf("GRUP");
      const header = parseGRUPHeader(mockBuffer, mgefOffset);

      expect(header.type).toBe("GRUP");
      expect(header.size).toBeGreaterThan(0);
      expect(header.groupType).toBe(0);
      expect(header.label.toString()).toBe("MGEF");
    });
  });

  describe("validateGRUPSize", () => {
    it("should validate correct GRUP size", () => {
      const buffer = Buffer.alloc(100);
      const header = { size: 24 };

      expect(() => validateGRUPSize(header, buffer, 0)).not.toThrow();
    });

    it("should throw for GRUP size too small", () => {
      const buffer = Buffer.alloc(100);
      const header = { size: 20 }; // Too small

      expect(() => validateGRUPSize(header, buffer, 0)).toThrow(
        "GRUP size too small"
      );
    });

    it("should throw for GRUP size exceeding buffer", () => {
      const buffer = Buffer.alloc(100);
      const header = { size: 200 }; // Too large

      expect(() => validateGRUPSize(header, buffer, 0)).toThrow(
        "GRUP size exceeds buffer length"
      );
    });
  });
});
