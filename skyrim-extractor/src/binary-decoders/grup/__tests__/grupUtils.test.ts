import { Buffer } from "buffer";
import { ProcessedRecordType } from "../../../constants";
import {
  debugLog,
  errorLog,
  getGroupTypeName,
  parseGRUPHeader,
  validateGRUPSize,
  processGrupRecord,
} from "../grupUtils";

// Mock parentPort
const mockPostMessage = jest.fn();
jest.mock("worker_threads", () => ({
  parentPort: {
    postMessage: (data: any) => mockPostMessage(data),
  },
}));

describe("grupUtils", () => {
  beforeEach(() => {
    mockPostMessage.mockClear();
  });

  describe("debugLog", () => {
    it("should send debug message to parent port", () => {
      debugLog("test message");
      expect(mockPostMessage).toHaveBeenCalledWith({
        type: "debug",
        message: "test message",
      });
    });
  });

  describe("errorLog", () => {
    it("should send error message to parent port", () => {
      errorLog("testFunction", "error message");
      expect(mockPostMessage).toHaveBeenCalledWith({
        type: "error",
        error: "[testFunction] error message",
      });
    });
  });

  describe("getGroupTypeName", () => {
    it("should return correct name for known group types", () => {
      expect(getGroupTypeName(0)).toBe("Top-Level");
      expect(getGroupTypeName(1)).toBe("World Children");
      expect(getGroupTypeName(2)).toBe("Interior Cell Block");
    });

    it("should return unknown for unknown group types", () => {
      expect(getGroupTypeName(999)).toBe("Unknown (999)");
    });
  });

  describe("parseGRUPHeader", () => {
    it("should parse valid GRUP header", () => {
      // Create a buffer with a valid GRUP header
      const buffer = Buffer.alloc(24);
      buffer.write("GRUP", 0);
      buffer.writeUInt32LE(100, 4); // size
      buffer.writeUInt32LE(0, 8); // groupType
      buffer.write("TEST", 12); // label
      buffer.writeUInt32LE(1234567890, 16); // timestamp
      buffer.writeUInt32LE(0, 20); // versionControl

      const header = parseGRUPHeader(buffer, 0);
      expect(header).toEqual({
        type: "GRUP",
        size: 100,
        groupType: 0,
        groupTypeStr: "Top-Level",
        label: Buffer.from("TEST"),
        timestamp: 1234567890,
        versionControl: 0,
      });
    });

    it("should throw error for invalid GRUP type", () => {
      const buffer = Buffer.alloc(24);
      buffer.write("TEST", 0);
      expect(() => parseGRUPHeader(buffer, 0)).toThrow(
        "Invalid GRUP header type: TEST"
      );
    });

    it("should throw error for buffer too small", () => {
      const buffer = Buffer.alloc(20); // Too small for GRUP header
      expect(() => parseGRUPHeader(buffer, 0)).toThrow(
        "Buffer too small for GRUP header"
      );
    });
  });

  describe("validateGRUPSize", () => {
    it("should not throw for valid GRUP size", () => {
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

    it("should throw for GRUP size exceeding buffer length", () => {
      const buffer = Buffer.alloc(100);
      const header = { size: 200 }; // Too large
      expect(() => validateGRUPSize(header, buffer, 0)).toThrow(
        "GRUP size exceeds buffer length"
      );
    });
  });

  describe("processGrupRecord", () => {
    it("should process valid GRUP record", () => {
      // Create a buffer with a valid GRUP record containing a SPEL record
      const buffer = Buffer.alloc(100);
      // GRUP header
      buffer.write("GRUP", 0);
      buffer.writeUInt32LE(80, 4); // size
      buffer.writeUInt32LE(0, 8); // groupType
      buffer.write("TEST", 12); // label
      buffer.writeUInt32LE(1234567890, 16); // timestamp
      buffer.writeUInt32LE(0, 20); // versionControl

      // SPEL record
      buffer.write("SPEL", 24);
      buffer.writeUInt32LE(40, 28); // size
      buffer.writeUInt32LE(0x12345678, 32); // flags
      buffer.writeUInt32LE(0xabcdef01, 36); // formId

      const processedTypes = new Set<ProcessedRecordType>(["SPEL"]);
      const result = processGrupRecord(buffer, 0, "test.esp", processedTypes);

      expect(result.records).toHaveLength(1);
      expect(result.records[0].meta.type).toBe("SPEL");
      expect(result.records[0].meta.formId).toBe("ABCDEF01");
      expect(result.records[0].meta.plugin).toBe("test.esp");
    });

    it("should skip unsupported record types", () => {
      const buffer = Buffer.alloc(100);
      // GRUP header
      buffer.write("GRUP", 0);
      buffer.writeUInt32LE(80, 4);
      buffer.writeUInt32LE(0, 8);
      buffer.write("TEST", 12);
      buffer.writeUInt32LE(1234567890, 16);
      buffer.writeUInt32LE(0, 20);

      // SPEL record
      buffer.write("SPEL", 24);
      buffer.writeUInt32LE(40, 28);
      buffer.writeUInt32LE(0x12345678, 32);
      buffer.writeUInt32LE(0xabcdef01, 36);

      const processedTypes = new Set<ProcessedRecordType>(["PERK"]); // Different type
      const result = processGrupRecord(buffer, 0, "test.esp", processedTypes);

      expect(result.records).toHaveLength(0);
    });
  });
});
