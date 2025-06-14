import { Buffer } from 'buffer';
import { BufferDecoder } from '../parser';
import { commonFieldSchemas, recordSpecificSchemas } from '../schemas';

describe('BufferDecoder', () => {
  let decoder: BufferDecoder;

  beforeEach(() => {
    decoder = new BufferDecoder();
  });

  describe('parseRecord', () => {
    it('should parse a record with string fields', () => {
      // Create a buffer with EDID and FULL fields
      const buffer = Buffer.alloc(20);
      buffer.write('EDID', 0); // Tag
      buffer.writeUInt16LE(4, 4); // Length
      buffer.write('Test', 6); // Data
      buffer.write('FULL', 10); // Tag
      buffer.writeUInt16LE(8, 14); // Length
      // Write UTF-16LE string
      buffer.write('T', 16, 2, 'utf16le');
      buffer.write('e', 18, 2, 'utf16le');
      buffer.write('s', 20, 2, 'utf16le');
      buffer.write('t', 22, 2, 'utf16le');
      buffer.write('N', 24, 2, 'utf16le');
      buffer.write('a', 26, 2, 'utf16le');
      buffer.write('m', 28, 2, 'utf16le');
      buffer.write('e', 30, 2, 'utf16le');

      const result = decoder.parseRecord('PERK', buffer);

      expect(result).toEqual({
        EDID: 'Test',
        FULL: 'TestName'
      });
    });

    it('should parse a record with numeric fields', () => {
      // Create a buffer with a DATA struct containing flags8
      const buffer = Buffer.alloc(12);
      buffer.write('DATA', 0); // Tag
      buffer.writeUInt16LE(6, 4); // Length
      buffer.writeUInt8(0x01, 6); // flags
      buffer.writeUInt8(10, 7); // levelReq
      buffer.writeUInt8(2, 8); // numPRKE

      const result = decoder.parseRecord('PERK', buffer);

      expect(result).toEqual({
        DATA: {
          flags: 1,
          levelReq: 10,
          numPRKE: 2
        }
      });
    });

    it('should parse a record with nested structs', () => {
      // Create a buffer with a SPEL DATA struct containing conditionBlock
      const buffer = Buffer.alloc(24); // Increased buffer size to accommodate all fields
      buffer.write('DATA', 0); // Tag
      buffer.writeUInt16LE(20, 4); // Length
      buffer.writeUInt32LE(1, 6); // spellType
      buffer.writeUInt32LE(100, 10); // cost
      buffer.writeUInt8(2, 14); // op
      buffer.writeFloatLE(1.5, 15); // value
      buffer.writeUInt32LE(42, 19); // functionIndex

      const result = decoder.parseRecord('SPEL', buffer);

      expect(result).toEqual({
        DATA: {
          spellType: 1,
          cost: 100,
          op: 2,
          value: 1.5,
          functionIndex: 42
        }
      });
    });

    it('should handle unknown fields gracefully', () => {
      // Create a buffer with an unknown field
      const buffer = Buffer.alloc(10);
      buffer.write('UNKN', 0); // Unknown tag
      buffer.writeUInt16LE(4, 4); // Length
      buffer.write('Data', 6); // Data

      const result = decoder.parseRecord('PERK', buffer);

      expect(result).toEqual({});
    });

    it('should throw error for invalid string encoding', () => {
      // Create a buffer with invalid string encoding
      const buffer = Buffer.alloc(10);
      buffer.write('EDID', 0); // Tag
      buffer.writeUInt16LE(4, 4); // Length
      buffer.write('Test', 6); // Data

      // Modify the schema to have invalid encoding
      const originalSchema = commonFieldSchemas.EDID;
      commonFieldSchemas.EDID = { type: 'string', encoding: 'invalid' as any };

      expect(() => decoder.parseRecord('PERK', buffer)).toThrow();

      // Restore original schema
      commonFieldSchemas.EDID = originalSchema;
    });

    it('should throw error for struct field without name', () => {
      // Create a buffer with a struct field without name
      const buffer = Buffer.alloc(10);
      buffer.write('DATA', 0); // Tag
      buffer.writeUInt16LE(4, 4); // Length
      buffer.writeUInt32LE(1, 6); // Data

      // Modify the schema to have a field without name
      const originalSchema = recordSpecificSchemas.PERK.DATA;
      recordSpecificSchemas.PERK.DATA = {
        type: 'struct',
        fields: [{ type: 'uint32' }]
      };

      expect(() => decoder.parseRecord('PERK', buffer)).toThrow();

      // Restore original schema
      recordSpecificSchemas.PERK.DATA = originalSchema;
    });

    it('should handle empty buffer', () => {
      const buffer = Buffer.alloc(0);
      const result = decoder.parseRecord('PERK', buffer);
      expect(result).toEqual({});
    });

    it('should handle buffer with only tag and length', () => {
      const buffer = Buffer.alloc(6);
      buffer.write('EDID', 0); // Tag
      buffer.writeUInt16LE(0, 4); // Length = 0

      const result = decoder.parseRecord('PERK', buffer);
      expect(result).toEqual({
        EDID: ''
      });
    });
  });
}); 