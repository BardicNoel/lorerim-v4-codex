import { describe, it, expect } from 'vitest';
import { parseBOOK, BOOK_SCHEMA } from '../BOOK.js';
import { Buffer } from 'buffer';

describe('BOOK Record Handler', () => {
  it('should parse a valid BOOK record', () => {
    // Create a buffer with test data
    const buffer = Buffer.alloc(100);
    let offset = 0;

    // EDID subrecord
    buffer.write('EDID', offset);
    buffer.writeUInt16LE(4, offset + 4);
    buffer.write('Book1', offset + 6);
    offset += 10;

    // FULL subrecord
    buffer.write('FULL', offset);
    buffer.writeUInt16LE(8, offset + 4);
    buffer.write('Test Book', offset + 6);
    offset += 14;

    // DESC subrecord
    buffer.write('DESC', offset);
    buffer.writeUInt16LE(12, offset + 4);
    buffer.write('Test Description', offset + 6);
    offset += 18;

    // DATA subrecord
    buffer.write('DATA', offset);
    buffer.writeUInt16LE(12, offset + 4);
    buffer.writeUInt32LE(0x1, offset + 6); // flags
    buffer.writeUInt32LE(50, offset + 10); // value
    buffer.writeFloatLE(1.0, offset + 14); // weight
    offset += 18;

    // ICON subrecord
    buffer.write('ICON', offset);
    buffer.writeUInt16LE(8, offset + 4);
    buffer.write('icon.dds', offset + 6);
    offset += 14;

    // MODEL subrecord
    buffer.write('MODL', offset);
    buffer.writeUInt16LE(8, offset + 4);
    buffer.write('book.nif', offset + 6);
    offset += 14;

    // YNAM subrecord
    buffer.write('YNAM', offset);
    buffer.writeUInt16LE(4, offset + 4);
    buffer.writeUInt32LE(0x12345678, offset + 6);
    offset += 10;

    // ZNAM subrecord
    buffer.write('ZNAM', offset);
    buffer.writeUInt16LE(4, offset + 4);
    buffer.writeUInt32LE(0x87654321, offset + 6);

    const result = parseBOOK(buffer, { 
      plugin: 'test.esp',
      loadOrder: 0,
      recordType: 'BOOK',
      formId: '00000000',
      fullFormId: '00000000',
      uniqueId: 'test.esp|00000000',
      winning: true,
      rawOffset: 0
    });

    expect(result.parsed).toEqual({
      EDID: 'Book1',
      FULL: 'Test Book',
      DESC: 'Test Description',
      DATA: {
        flags: 0x1,
        value: 50,
        weight: 1.0
      },
      ICON: 'icon.dds',
      MODEL: 'book.nif',
      YNAM: 0x12345678,
      ZNAM: 0x87654321
    });
  });

  it('should handle missing optional fields', () => {
    const buffer = Buffer.alloc(10);
    buffer.write('EDID', 0);
    buffer.writeUInt16LE(4, 4);
    buffer.write('Book1', 6);

    const result = parseBOOK(buffer, { 
      plugin: 'test.esp',
      loadOrder: 0,
      recordType: 'BOOK',
      formId: '00000000',
      fullFormId: '00000000',
      uniqueId: 'test.esp|00000000',
      winning: true,
      rawOffset: 0
    });

    expect(result.parsed).toEqual({
      EDID: 'Book1'
    });
  });

  it('should handle malformed subrecords', () => {
    const buffer = Buffer.alloc(20);
    buffer.write('EDID', 0);
    buffer.writeUInt16LE(4, 4);
    buffer.write('Book1', 6);

    // Add a malformed DATA subrecord (too small)
    buffer.write('DATA', 10);
    buffer.writeUInt16LE(4, 14); // Size too small for DATA
    buffer.writeUInt32LE(0x1, 16);

    const result = parseBOOK(buffer, { 
      plugin: 'test.esp',
      loadOrder: 0,
      recordType: 'BOOK',
      formId: '00000000',
      fullFormId: '00000000',
      uniqueId: 'test.esp|00000000',
      winning: true,
      rawOffset: 0
    });

    expect(result.parsed).toEqual({
      EDID: 'Book1'
    });
  });
}); 