import { processGRUP } from "../grup/grupHandler";
import { ParsedRecord } from "../../types";

describe("GRUP Handler", () => {
  // Helper to create a GRUP header buffer
  function createGRUPHeader(
    size: number,
    groupType: number,
    label: string = "",
    timestamp: number = 0,
    versionControl: number = 0
  ): Buffer {
    const buffer = Buffer.alloc(24);
    buffer.write("GRUP", 0, 4, "ascii");
    buffer.writeUInt32LE(size, 4);
    buffer.writeUInt32LE(groupType, 8);
    if (label) {
      buffer.write(label, 12, 4, "ascii");
    }
    buffer.writeUInt32LE(timestamp, 16);
    buffer.writeUInt32LE(versionControl, 20);
    return buffer;
  }

  // Helper to create a record header buffer
  function createRecordHeader(
    type: string,
    dataSize: number,
    formId: number = 0,
    flags: number = 0
  ): Buffer {
    const buffer = Buffer.alloc(20);
    buffer.write(type, 0, 4, "ascii");
    buffer.writeUInt32LE(dataSize, 4);
    buffer.writeUInt32LE(formId, 8);
    buffer.writeUInt32LE(flags, 12);
    return buffer;
  }

  // Helper to create a subrecord buffer
  function createSubrecord(type: string, data: Buffer): Buffer {
    const buffer = Buffer.alloc(6 + data.length);
    buffer.write(type, 0, 4, "ascii");
    buffer.writeUInt16LE(data.length, 4);
    data.copy(buffer, 6);
    return buffer;
  }

  describe("Top-Level GRUP (type 0)", () => {
    it("should process a PERK GRUP correctly", () => {
      // Create a PERK record with EDID subrecord
      const edidData = Buffer.from("TestPerk\0", "ascii");
      const subrecord = createSubrecord("EDID", edidData);

      const recordHeader = createRecordHeader(
        "PERK",
        subrecord.length,
        0x12345678
      );
      const recordBuffer = Buffer.concat([recordHeader, subrecord]);

      // Create GRUP header for PERK records
      const grupHeader = createGRUPHeader(
        24 + recordBuffer.length, // Total size
        0, // Top-level GRUP
        "PERK" // Label
      );

      // Combine into full GRUP buffer
      const grupBuffer = Buffer.concat([grupHeader, recordBuffer]);

      // Process the GRUP
      const records = processGRUP(grupBuffer, 0, "test.esp");

      // Verify results
      expect(records).toHaveLength(1);
      expect(records[0].meta).toEqual({
        type: "PERK",
        formId: "12345678",
        plugin: "test.esp",
      });
      expect(records[0].data).toHaveProperty("EDID");
      expect(records[0].data.EDID[0]).toBe("VGVzdFByZWt");
    });

    it("should skip non-processed record types", () => {
      // Create a WEAP record (not in PROCESSED_RECORD_TYPES)
      const recordHeader = createRecordHeader("WEAP", 0);
      const grupHeader = createGRUPHeader(
        24 + 20, // Total size
        0, // Top-level GRUP
        "WEAP" // Label
      );

      const grupBuffer = Buffer.concat([grupHeader, recordHeader]);

      // Process should not throw, just return empty array
      const records = processGRUP(grupBuffer, 0, "test.esp");
      expect(records).toHaveLength(0);
    });
  });

  describe("Nested GRUP", () => {
    it("should process nested GRUPs correctly", () => {
      // Create a PERK record
      const edidData = Buffer.from("NestedPerk\0", "ascii");
      const subrecord = createSubrecord("EDID", edidData);
      const recordHeader = createRecordHeader(
        "PERK",
        subrecord.length,
        0x87654321
      );
      const recordBuffer = Buffer.concat([recordHeader, subrecord]);

      // Create nested GRUP header
      const nestedGrupHeader = createGRUPHeader(
        24 + recordBuffer.length, // Total size
        1, // World Children
        "PERK" // Label
      );
      const nestedGrupBuffer = Buffer.concat([nestedGrupHeader, recordBuffer]);

      // Create parent GRUP header
      const parentGrupHeader = createGRUPHeader(
        24 + nestedGrupBuffer.length, // Total size
        0, // Top-level GRUP
        "CELL" // Label
      );

      // Combine into full GRUP buffer
      const grupBuffer = Buffer.concat([parentGrupHeader, nestedGrupBuffer]);

      // Process the GRUP
      const records = processGRUP(grupBuffer, 0, "test.esp");

      // Verify results
      expect(records).toHaveLength(1);
      expect(records[0].meta).toEqual({
        type: "PERK",
        formId: "87654321",
        plugin: "test.esp",
      });
      expect(records[0].data).toHaveProperty("EDID");
      expect(records[0].data.EDID[0]).toBe("Tm9uZWRQcmVr");
    });

    it("should handle multiple records in nested GRUP", () => {
      // Create two PERK records
      const perk1 = {
        edid: Buffer.from("Perk1\0", "ascii"),
        formId: 0x11111111,
      };
      const perk2 = {
        edid: Buffer.from("Perk2\0", "ascii"),
        formId: 0x22222222,
      };

      const subrecord1 = createSubrecord("EDID", perk1.edid);
      const subrecord2 = createSubrecord("EDID", perk2.edid);

      const record1 = Buffer.concat([
        createRecordHeader("PERK", subrecord1.length, perk1.formId),
        subrecord1,
      ]);

      const record2 = Buffer.concat([
        createRecordHeader("PERK", subrecord2.length, perk2.formId),
        subrecord2,
      ]);

      // Create nested GRUP header
      const nestedGrupHeader = createGRUPHeader(
        24 + record1.length + record2.length, // Total size
        1, // World Children
        "PERK" // Label
      );
      const nestedGrupBuffer = Buffer.concat([
        nestedGrupHeader,
        record1,
        record2,
      ]);

      // Create parent GRUP header
      const parentGrupHeader = createGRUPHeader(
        24 + nestedGrupBuffer.length, // Total size
        0, // Top-level GRUP
        "CELL" // Label
      );

      // Combine into full GRUP buffer
      const grupBuffer = Buffer.concat([parentGrupHeader, nestedGrupBuffer]);

      // Process the GRUP
      const records = processGRUP(grupBuffer, 0, "test.esp");

      // Verify results
      expect(records).toHaveLength(2);
      expect(records[0].meta.formId).toBe("11111111");
      expect(records[1].meta.formId).toBe("22222222");
      expect(records[0].data.EDID[0]).toBe("U3RyaW5nIGZvciB0ZXN0aW5n");
      expect(records[1].data.EDID[0]).toBe("U3RyaW5nIGZvciB0ZXN0aW5n");
    });
  });

  describe("Error Handling", () => {
    it("should handle invalid GRUP size", () => {
      const grupHeader = createGRUPHeader(
        0, // Invalid size
        0,
        "PERK"
      );

      expect(() => processGRUP(grupHeader, 0, "test.esp")).toThrow();
    });

    it("should handle invalid record type", () => {
      // Create a record with invalid type
      const recordHeader = createRecordHeader("INVA", 0);
      const grupHeader = createGRUPHeader(
        24 + 20, // Total size
        0, // Top-level GRUP
        "INVA" // Label
      );

      const grupBuffer = Buffer.concat([grupHeader, recordHeader]);

      // Process should not throw, just return empty array
      const records = processGRUP(grupBuffer, 0, "test.esp");
      expect(records).toHaveLength(0);
    });
  });
});
