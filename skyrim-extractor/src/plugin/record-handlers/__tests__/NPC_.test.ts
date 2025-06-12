import { describe, it, expect } from 'vitest';
import { parseNPC_, NPC_SCHEMA } from '../NPC_.js';
import { Buffer } from 'buffer';

describe('NPC_ Record Handler', () => {
  it('should parse a valid NPC_ record', () => {
    // Create a test buffer with all NPC_ subrecords
    const buffer = Buffer.concat([
      // EDID - Editor ID
      Buffer.from('EDID'),
      Buffer.from([0x0C, 0x00]), // size
      Buffer.from('TestNPC\0'),
      
      // FULL - Name
      Buffer.from('FULL'),
      Buffer.from([0x0A, 0x00]), // size
      Buffer.from('Test NPC\0'),
      
      // ACBS - Actor base stats
      Buffer.from('ACBS'),
      Buffer.from([0x24, 0x00]), // size
      Buffer.concat([
        Buffer.from([0x01, 0x00, 0x00, 0x00]), // flags
        Buffer.from([0x64, 0x00]), // baseSpellPoints
        Buffer.from([0x32, 0x00]), // fatigue
        Buffer.from([0x0A, 0x00, 0x00, 0x00]), // barterGold
        Buffer.from([0x01, 0x00]), // level
        Buffer.from([0x01, 0x00]), // calcMin
        Buffer.from([0x01, 0x00]), // calcMax
        Buffer.from([0x32, 0x00]), // disposition
        Buffer.from([0x00, 0x00]), // unused1
        Buffer.from([0x00, 0x00]), // healthOffset
        Buffer.from([0x00, 0x00]), // magickaOffset
        Buffer.from([0x00, 0x00]), // staminaOffset
        Buffer.from([0x32, 0x32, 0x32, 0x32, 0x32, 0x32, 0x32]) // attributes
      ]),
      
      // AIDT - AI data
      Buffer.from('AIDT'),
      Buffer.from([0x0C, 0x00]), // size
      Buffer.from([
        0x32, // aggression
        0x32, // confidence
        0x32, // energyLevel
        0x32, // responsibility
        0x32, // mood
        0x00, // unused1
        0x00, // unused2
        0x00, // unused3
        0x32, // assistance
        0x00, // unused4
        0x00, // unused5
        0x00  // unused6
      ]),
      
      // DATA - Flags and base info
      Buffer.from('DATA'),
      Buffer.from([0x10, 0x00]), // size
      Buffer.from([
        0x01, 0x00, 0x00, 0x00, // flags
        0x00, 0x00, 0x00, 0x00, // unused1
        0x00, 0x00, 0x00, 0x00, // unused2
        0x00, 0x00, 0x00, 0x00  // unused3
      ])
    ]);

    const meta = {
      plugin: 'test.esp',
      loadOrder: 0,
      recordType: 'NPC_',
      formId: '00000001',
      fullFormId: '00000001',
      uniqueId: 'test.esp|00000001',
      winning: true,
      rawOffset: 0
    };

    const result = parseNPC_(buffer, meta);

    expect(result.parsed).toEqual({
      EDID: 'TestNPC',
      FULL: 'Test NPC',
      ACBS: {
        flags: 1,
        baseSpellPoints: 100,
        fatigue: 50,
        barterGold: 10,
        level: 1,
        calcMin: 1,
        calcMax: 1,
        disposition: 50,
        unused1: 0,
        healthOffset: 0,
        magickaOffset: 0,
        staminaOffset: 0,
        attributes: [50, 50, 50, 50, 50, 50, 50]
      },
      AIDT: {
        aggression: 50,
        confidence: 50,
        energyLevel: 50,
        responsibility: 50,
        mood: 50,
        unused1: 0,
        unused2: 0,
        unused3: 0,
        assistance: 50,
        unused4: 0,
        unused5: 0,
        unused6: 0
      },
      DATA: {
        flags: 1,
        unused1: 0,
        unused2: 0,
        unused3: 0
      }
    });
  });

  it('should handle missing optional fields', () => {
    const buffer = Buffer.concat([
      // EDID - Editor ID
      Buffer.from('EDID'),
      Buffer.from([0x0C, 0x00]), // size
      Buffer.from('TestNPC\0')
    ]);

    const meta = {
      plugin: 'test.esp',
      loadOrder: 0,
      recordType: 'NPC_',
      formId: '00000001',
      fullFormId: '00000001',
      uniqueId: 'test.esp|00000001',
      winning: true,
      rawOffset: 0
    };

    const result = parseNPC_(buffer, meta);

    expect(result.parsed).toEqual({
      EDID: 'TestNPC'
    });
  });

  it('should handle malformed subrecords', () => {
    const buffer = Buffer.concat([
      // EDID - Editor ID
      Buffer.from('EDID'),
      Buffer.from([0x0C, 0x00]), // size
      Buffer.from('TestNPC\0'),
      
      // Malformed ACBS
      Buffer.from('ACBS'),
      Buffer.from([0x02, 0x00]), // size too small
      Buffer.from([0x01, 0x02]),
      
      // Malformed AIDT
      Buffer.from('AIDT'),
      Buffer.from([0x01, 0x00]), // size too small
      Buffer.from([0x01])
    ]);

    const meta = {
      plugin: 'test.esp',
      loadOrder: 0,
      recordType: 'NPC_',
      formId: '00000001',
      fullFormId: '00000001',
      uniqueId: 'test.esp|00000001',
      winning: true,
      rawOffset: 0
    };

    const result = parseNPC_(buffer, meta);

    expect(result.parsed).toEqual({
      EDID: 'TestNPC'
    });
  });
}); 