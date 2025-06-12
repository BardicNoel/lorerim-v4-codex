import { describe, it, expect } from 'vitest';
import { parseRACE, RACE_SCHEMA } from '../RACE.js';
import { Buffer } from 'buffer';

describe('RACE Record Handler', () => {
  it('should parse a valid RACE record', () => {
    // Create a buffer with test data
    const buffer = Buffer.alloc(200);
    let offset = 0;

    // EDID subrecord
    buffer.write('EDID', offset);
    buffer.writeUInt16LE(4, offset + 4);
    buffer.write('Nord', offset + 6);
    offset += 10;

    // FULL subrecord
    buffer.write('FULL', offset);
    buffer.writeUInt16LE(4, offset + 4);
    buffer.write('Nord', offset + 6);
    offset += 10;

    // DATA subrecord
    buffer.write('DATA', offset);
    buffer.writeUInt16LE(108, offset + 4);
    // Write some test values
    buffer.writeUInt32LE(0x1, offset + 6); // flags
    buffer.writeFloatLE(1.0, offset + 10); // maleHeight
    buffer.writeFloatLE(1.0, offset + 14); // femaleHeight
    buffer.writeFloatLE(1.0, offset + 18); // maleWeight
    buffer.writeFloatLE(1.0, offset + 22); // femaleWeight
    buffer.writeUInt32LE(100, offset + 26); // startingHealth
    buffer.writeUInt32LE(100, offset + 30); // startingMagicka
    buffer.writeUInt32LE(100, offset + 34); // startingStamina
    buffer.writeFloatLE(300, offset + 38); // baseCarryWeight
    buffer.writeFloatLE(1.0, offset + 42); // baseMass
    buffer.writeFloatLE(1.0, offset + 46); // accelerationRate
    buffer.writeFloatLE(1.0, offset + 50); // decelerationRate
    buffer.writeUInt32LE(1, offset + 54); // size
    buffer.writeUInt32LE(1, offset + 58); // headBipedObject
    buffer.writeUInt32LE(1, offset + 62); // hairBipedObject
    buffer.writeFloatLE(0.7, offset + 66); // injuredHealthPercent
    buffer.writeUInt32LE(1, offset + 70); // shieldBipedObject
    buffer.writeFloatLE(1.0, offset + 74); // healthRegen
    buffer.writeFloatLE(1.0, offset + 78); // magickaRegen
    buffer.writeFloatLE(1.0, offset + 82); // staminaRegen
    buffer.writeFloatLE(4, offset + 86); // unarmedDamage
    buffer.writeFloatLE(1.0, offset + 90); // unarmedReach
    buffer.writeUInt32LE(1, offset + 94); // bodyBipedObject
    buffer.writeFloatLE(1.0, offset + 98); // aimAngleTolerance
    buffer.writeFloatLE(1.0, offset + 102); // angularAccelerationRate
    buffer.writeFloatLE(1.0, offset + 106); // angularTolerance
    buffer.writeUInt32LE(0, offset + 110); // flags2
    offset += 114;

    // SPLO subrecord
    buffer.write('SPLO', offset);
    buffer.writeUInt16LE(4, offset + 4);
    buffer.writeUInt32LE(0x12345678, offset + 6);
    offset += 10;

    // DNAM subrecord
    buffer.write('DNAM', offset);
    buffer.writeUInt16LE(16, offset + 4);
    buffer.writeFloatLE(1.0, offset + 6); // maleHeight
    buffer.writeFloatLE(1.0, offset + 10); // femaleHeight
    buffer.writeFloatLE(1.0, offset + 14); // maleWeight
    buffer.writeFloatLE(1.0, offset + 18); // femaleWeight

    const result = parseRACE(buffer, { 
      plugin: 'test.esp',
      loadOrder: 0,
      recordType: 'RACE',
      formId: '00000000',
      fullFormId: '00000000',
      uniqueId: 'test.esp|00000000',
      winning: true,
      rawOffset: 0
    });

    expect(result.parsed).toEqual({
      EDID: 'Nord',
      FULL: 'Nord',
      DATA: {
        flags: 0x1,
        maleHeight: 1.0,
        femaleHeight: 1.0,
        maleWeight: 1.0,
        femaleWeight: 1.0,
        startingHealth: 100,
        startingMagicka: 100,
        startingStamina: 100,
        baseCarryWeight: 300,
        baseMass: 1.0,
        accelerationRate: 1.0,
        decelerationRate: 1.0,
        size: 1,
        headBipedObject: 1,
        hairBipedObject: 1,
        injuredHealthPercent: 0.7,
        shieldBipedObject: 1,
        healthRegen: 1.0,
        magickaRegen: 1.0,
        staminaRegen: 1.0,
        unarmedDamage: 4,
        unarmedReach: 1.0,
        bodyBipedObject: 1,
        aimAngleTolerance: 1.0,
        angularAccelerationRate: 1.0,
        angularTolerance: 1.0,
        flags2: 0
      },
      SPLO: [0x12345678],
      DNAM: {
        maleHeight: 1.0,
        femaleHeight: 1.0,
        maleWeight: 1.0,
        femaleWeight: 1.0
      }
    });
  });

  it('should handle missing optional fields', () => {
    const buffer = Buffer.alloc(10);
    buffer.write('EDID', 0);
    buffer.writeUInt16LE(4, 4);
    buffer.write('Nord', 6);

    const result = parseRACE(buffer, { 
      plugin: 'test.esp',
      loadOrder: 0,
      recordType: 'RACE',
      formId: '00000000',
      fullFormId: '00000000',
      uniqueId: 'test.esp|00000000',
      winning: true,
      rawOffset: 0
    });

    expect(result.parsed).toEqual({
      EDID: 'Nord'
    });
  });

  it('should handle malformed subrecords', () => {
    const buffer = Buffer.alloc(20);
    buffer.write('EDID', 0);
    buffer.writeUInt16LE(4, 4);
    buffer.write('Nord', 6);

    // Add a malformed DATA subrecord (too small)
    buffer.write('DATA', 10);
    buffer.writeUInt16LE(4, 14); // Size too small for DATA
    buffer.writeUInt32LE(0x1, 16);

    const result = parseRACE(buffer, { 
      plugin: 'test.esp',
      loadOrder: 0,
      recordType: 'RACE',
      formId: '00000000',
      fullFormId: '00000000',
      uniqueId: 'test.esp|00000000',
      winning: true,
      rawOffset: 0
    });

    expect(result.parsed).toEqual({
      EDID: 'Nord'
    });
  });
}); 