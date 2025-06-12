import { describe, it, expect } from 'vitest';
import { parseLVLI, LVLI_SCHEMA } from '../LVLI.js';
import { Buffer } from 'buffer';

describe('LVLI Record Handler', () => {
  it('should parse a valid LVLI record', () => {
    // Create a test buffer with all LVLI subrecords
    const buffer = Buffer.concat([
      // EDID - Editor ID
      Buffer.from('EDID'),
      Buffer.from([0x0C, 0x00]), // size
      Buffer.from('TestList\0'),
      
      // LVLD - List flags
      Buffer.from('LVLD'),
      Buffer.from([0x01, 0x00]), // size
      Buffer.from([0x01]), // flags
      
      // LVLF - Flags
      Buffer.from('LVLF'),
      Buffer.from([0x01, 0x00]), // size
      Buffer.from([0x02]), // flags
      
      // LLCT - List count
      Buffer.from('LLCT'),
      Buffer.from([0x04, 0x00]), // size
      Buffer.from([0x02, 0x00, 0x00, 0x00]), // count
      
      // CNTO - First item
      Buffer.from('CNTO'),
      Buffer.from([0x0C, 0x00]), // size
      Buffer.from([
        0x01, 0x00, 0x00, 0x00, // item
        0x01, 0x00, 0x00, 0x00, // level
        0x01, 0x00, 0x00, 0x00  // count
      ]),
      
      // CNTO - Second item
      Buffer.from('CNTO'),
      Buffer.from([0x0C, 0x00]), // size
      Buffer.from([
        0x02, 0x00, 0x00, 0x00, // item
        0x02, 0x00, 0x00, 0x00, // level
        0x02, 0x00, 0x00, 0x00  // count
      ])
    ]);

    const meta = {
      plugin: 'test.esp',
      loadOrder: 0,
      recordType: 'LVLI',
      formId: '00000001',
      fullFormId: '00000001',
      uniqueId: 'test.esp|00000001',
      winning: true,
      rawOffset: 0
    };

    const result = parseLVLI(buffer, meta);

    expect(result.parsed).toEqual({
      EDID: 'TestList',
      LVLD: 1,
      LVLF: 2,
      LLCT: 2,
      CNTO: [
        { item: 0x00000001, level: 1, count: 1 },
        { item: 0x00000002, level: 2, count: 2 }
      ]
    });
  });

  it('should handle missing optional fields', () => {
    const buffer = Buffer.concat([
      // EDID - Editor ID
      Buffer.from('EDID'),
      Buffer.from([0x0C, 0x00]), // size
      Buffer.from('TestList\0')
    ]);

    const meta = {
      plugin: 'test.esp',
      loadOrder: 0,
      recordType: 'LVLI',
      formId: '00000001',
      fullFormId: '00000001',
      uniqueId: 'test.esp|00000001',
      winning: true,
      rawOffset: 0
    };

    const result = parseLVLI(buffer, meta);

    expect(result.parsed).toEqual({
      EDID: 'TestList'
    });
  });

  it('should handle malformed subrecords', () => {
    const buffer = Buffer.concat([
      // EDID - Editor ID
      Buffer.from('EDID'),
      Buffer.from([0x0C, 0x00]), // size
      Buffer.from('TestList\0'),
      
      // Malformed LVLD
      Buffer.from('LVLD'),
      Buffer.from([0x00, 0x00]), // size too small
      Buffer.from([]),
      
      // Malformed CNTO
      Buffer.from('CNTO'),
      Buffer.from([0x02, 0x00]), // size too small
      Buffer.from([0x01, 0x02])
    ]);

    const meta = {
      plugin: 'test.esp',
      loadOrder: 0,
      recordType: 'LVLI',
      formId: '00000001',
      fullFormId: '00000001',
      uniqueId: 'test.esp|00000001',
      winning: true,
      rawOffset: 0
    };

    const result = parseLVLI(buffer, meta);

    expect(result.parsed).toEqual({
      EDID: 'TestList'
    });
  });
}); 