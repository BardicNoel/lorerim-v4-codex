import { describe, it, expect } from 'vitest';
import { parsePERK, PERK_SCHEMA } from '../PERK.js';
import { Buffer } from 'buffer';

describe('PERK Record Handler', () => {
  it('should parse a valid PERK record', () => {
    // Create a test buffer with all PERK subrecords
    const buffer = Buffer.concat([
      // EDID - Editor ID
      Buffer.from('EDID'),
      Buffer.from([0x08, 0x00]), // size
      Buffer.from('TestPerk\0'),
      
      // FULL - Name
      Buffer.from('FULL'),
      Buffer.from([0x0A, 0x00]), // size
      Buffer.from('Test Perk\0'),
      
      // DESC - Description
      Buffer.from('DESC'),
      Buffer.from([0x0F, 0x00]), // size
      Buffer.from('Test Description\0'),
      
      // DATA - Perk data
      Buffer.from('DATA'),
      Buffer.from([0x05, 0x00]), // size
      Buffer.from([0x01, 0x02, 0x03, 0x01, 0x00]), // trait, minLevel, numRanks, playable, hidden
      
      // PRKE - Perk entry
      Buffer.from('PRKE'),
      Buffer.from([0x03, 0x00]), // size
      Buffer.from([0x01, 0x02, 0x03]) // rank, priority, condition
    ]);

    const meta = {
      plugin: 'test.esp',
      loadOrder: 0,
      recordType: 'PERK',
      formId: '00000001',
      fullFormId: '00000001',
      uniqueId: 'test.esp|00000001',
      winning: true,
      rawOffset: 0
    };

    const result = parsePERK(buffer, meta);

    expect(result.parsed).toEqual({
      EDID: 'TestPerk',
      FULL: 'Test Perk',
      DESC: 'Test Description',
      DATA: {
        trait: 1,
        minLevel: 2,
        numRanks: 3,
        playable: 1,
        hidden: 0
      },
      PRKE: [{
        rank: 1,
        priority: 2,
        condition: 3
      }]
    });
  });

  it('should handle missing optional fields', () => {
    const buffer = Buffer.concat([
      // EDID - Editor ID
      Buffer.from('EDID'),
      Buffer.from([0x08, 0x00]), // size
      Buffer.from('TestPerk\0')
    ]);

    const meta = {
      plugin: 'test.esp',
      loadOrder: 0,
      recordType: 'PERK',
      formId: '00000001',
      fullFormId: '00000001',
      uniqueId: 'test.esp|00000001',
      winning: true,
      rawOffset: 0
    };

    const result = parsePERK(buffer, meta);

    expect(result.parsed).toEqual({
      EDID: 'TestPerk'
    });
  });

  it('should handle malformed subrecords', () => {
    const buffer = Buffer.concat([
      // EDID - Editor ID
      Buffer.from('EDID'),
      Buffer.from([0x08, 0x00]), // size
      Buffer.from('TestPerk\0'),
      
      // Malformed DATA
      Buffer.from('DATA'),
      Buffer.from([0x02, 0x00]), // size too small
      Buffer.from([0x01, 0x02]),
      
      // Malformed PRKE
      Buffer.from('PRKE'),
      Buffer.from([0x01, 0x00]), // size too small
      Buffer.from([0x01])
    ]);

    const meta = {
      plugin: 'test.esp',
      loadOrder: 0,
      recordType: 'PERK',
      formId: '00000001',
      fullFormId: '00000001',
      uniqueId: 'test.esp|00000001',
      winning: true,
      rawOffset: 0
    };

    const result = parsePERK(buffer, meta);

    expect(result.parsed).toEqual({
      EDID: 'TestPerk'
    });
  });
}); 