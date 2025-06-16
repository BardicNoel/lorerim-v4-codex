import { Buffer } from "buffer";
import { processGRUP, processNestedGRUP } from "../grupHandler";
import { StatsCollector } from "../../../utils/stats";

describe("GRUP Handler", () => {
  let statsCollector: StatsCollector;
  const pluginName = "test.esp";

  beforeEach(() => {
    statsCollector = new StatsCollector();
    jest.clearAllMocks();
  });

  describe("processGRUP", () => {
    it("should process a simple GRUP with one record", () => {
      // Create a simple GRUP with one record
      const buffer = Buffer.alloc(100);
      // Write GRUP header
      buffer.write("GRUP", 0);
      buffer.writeUInt32LE(80, 4); // dataSize
      buffer.write("TEST", 8); // label
      buffer.writeUInt32LE(0, 16); // timestamp

      // Write a record inside the GRUP
      buffer.write("TEST", 24); // record type
      buffer.writeUInt32LE(10, 28); // dataSize

      const records = processGRUP(buffer, 0, pluginName, statsCollector);
      expect(records).toHaveLength(1);
      expect(records[0].meta.type).toBe("TEST");
    });

    it("should handle nested GRUPs", () => {
      // Create a GRUP containing another GRUP
      const buffer = Buffer.alloc(200);
      // Write outer GRUP header
      buffer.write("GRUP", 0);
      buffer.writeUInt32LE(180, 4); // dataSize
      buffer.write("TEST", 8); // label
      buffer.writeUInt32LE(0, 16); // timestamp

      // Write inner GRUP
      buffer.write("GRUP", 24);
      buffer.writeUInt32LE(100, 28); // dataSize
      buffer.write("TEST", 32); // label
      buffer.writeUInt32LE(0, 40); // timestamp

      // Write a record inside the inner GRUP
      buffer.write("TEST", 48);
      buffer.writeUInt32LE(10, 52); // dataSize

      const records = processGRUP(buffer, 0, pluginName, statsCollector);
      expect(records).toHaveLength(1);
      expect(records[0].meta.type).toBe("TEST");
    });

    it("should handle unsupported record types", () => {
      const buffer = Buffer.alloc(100);
      // Write GRUP header
      buffer.write("GRUP", 0);
      buffer.writeUInt32LE(80, 4); // dataSize
      buffer.write("TEST", 8); // label
      buffer.writeUInt32LE(0, 16); // timestamp

      // Write an unsupported record type
      buffer.write("UNSU", 24); // record type
      buffer.writeUInt32LE(10, 28); // dataSize

      const records = processGRUP(buffer, 0, pluginName, statsCollector);
      expect(records).toHaveLength(0);
      expect(statsCollector.getStats().skippedRecords).toBe(1);
    });

    it("should handle truncated GRUP", () => {
      const buffer = Buffer.alloc(50);
      // Write GRUP header with size larger than buffer
      buffer.write("GRUP", 0);
      buffer.writeUInt32LE(1000, 4); // dataSize larger than buffer
      buffer.write("TEST", 8); // label
      buffer.writeUInt32LE(0, 16); // timestamp

      const records = processGRUP(buffer, 0, pluginName, statsCollector);
      expect(records).toHaveLength(0);
    });

    it("should handle malformed record headers", () => {
      const buffer = Buffer.alloc(100);
      // Write GRUP header
      buffer.write("GRUP", 0);
      buffer.writeUInt32LE(80, 4); // dataSize
      buffer.write("TEST", 8); // label
      buffer.writeUInt32LE(0, 16); // timestamp

      // Write malformed record (no valid header)
      buffer.fill(0, 24, 100);

      const records = processGRUP(buffer, 0, pluginName, statsCollector);
      expect(records).toHaveLength(0);
      expect(statsCollector.getStats().errors).toBeGreaterThan(0);
    });

    it("should handle max iterations limit", () => {
      const buffer = Buffer.alloc(10000);
      // Write GRUP header
      buffer.write("GRUP", 0);
      buffer.writeUInt32LE(9900, 4); // dataSize
      buffer.write("TEST", 8); // label
      buffer.writeUInt32LE(0, 16); // timestamp

      // Write many small records to trigger iteration limit
      let offset = 24;
      for (let i = 0; i < 10000; i++) {
        buffer.write("TEST", offset);
        buffer.writeUInt32LE(1, offset + 4); // dataSize
        offset += 8;
      }

      const records = processGRUP(buffer, 0, pluginName, statsCollector);
      expect(statsCollector.getStats().errors).toBeGreaterThan(0);
    });
  });

  describe("processNestedGRUP", () => {
    it("should process a nested GRUP correctly", () => {
      const buffer = Buffer.alloc(200);
      // Write GRUP header
      buffer.write("GRUP", 0);
      buffer.writeUInt32LE(180, 4); // dataSize
      buffer.write("TEST", 8); // label
      buffer.writeUInt32LE(0, 16); // timestamp

      // Write a record
      buffer.write("TEST", 24);
      buffer.writeUInt32LE(10, 28); // dataSize

      const records = processNestedGRUP(buffer, 0, pluginName, statsCollector);
      expect(records).toHaveLength(1);
      expect(records[0].meta.type).toBe("TEST");
    });

    it("should handle empty GRUP", () => {
      const buffer = Buffer.alloc(24);
      // Write GRUP header with no data
      buffer.write("GRUP", 0);
      buffer.writeUInt32LE(0, 4); // dataSize
      buffer.write("TEST", 8); // label
      buffer.writeUInt32LE(0, 16); // timestamp

      const records = processNestedGRUP(buffer, 0, pluginName, statsCollector);
      expect(records).toHaveLength(0);
    });

    it("should handle GRUP with multiple record types", () => {
      const buffer = Buffer.alloc(200);
      // Write GRUP header
      buffer.write("GRUP", 0);
      buffer.writeUInt32LE(180, 4); // dataSize
      buffer.write("TEST", 8); // label
      buffer.writeUInt32LE(0, 16); // timestamp

      // Write multiple records of different types
      let offset = 24;
      const recordTypes = ["TEST", "SPEL", "MGEF"];
      recordTypes.forEach((type) => {
        buffer.write(type, offset);
        buffer.writeUInt32LE(10, offset + 4); // dataSize
        offset += 14;
      });

      const records = processNestedGRUP(buffer, 0, pluginName, statsCollector);
      expect(records).toHaveLength(recordTypes.length);
      recordTypes.forEach((type, index) => {
        expect(records[index].meta.type).toBe(type);
      });
    });

    it("should handle GRUP with invalid record sizes", () => {
      const buffer = Buffer.alloc(100);
      // Write GRUP header
      buffer.write("GRUP", 0);
      buffer.writeUInt32LE(80, 4); // dataSize
      buffer.write("TEST", 8); // label
      buffer.writeUInt32LE(0, 16); // timestamp

      // Write record with invalid size
      buffer.write("TEST", 24);
      buffer.writeUInt32LE(1000, 28); // dataSize larger than remaining buffer

      const records = processNestedGRUP(buffer, 0, pluginName, statsCollector);
      expect(records).toHaveLength(0);
      expect(statsCollector.getStats().errors).toBeGreaterThan(0);
    });
  });
});
