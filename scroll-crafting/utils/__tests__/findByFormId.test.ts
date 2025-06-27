import { describe, it, expect } from 'vitest';
import { findByFormId } from '../findByFormId';

describe('findByFormId', () => {
  it('should find a record by formId in meta.globalFormId', () => {
    const records = [
      {
        meta: { 
          globalFormId: '0x2C123456',
          type: 'SPEL',
          plugin: 'Test.esp'
        },
        decodedData: {
          EDID: 'TestSpell01',
          FULL: 'Test Spell 1'
        }
      },
      {
        meta: { 
          globalFormId: '0x2C678901',
          type: 'SPEL', 
          plugin: 'Test.esp'
        },
        decodedData: {
          EDID: 'TestSpell02',
          FULL: 'Test Spell 2'
        }
      }
    ];

    const result = findByFormId(records, '0x2C123456');
    expect(result).toEqual({
      meta: { 
        globalFormId: '0x2C123456',
        type: 'SPEL',
        plugin: 'Test.esp'
      },
      decodedData: {
        EDID: 'TestSpell01',
        FULL: 'Test Spell 1'
      }
    });
  });

  it('should return null when formId is not found', () => {
    const records = [
      {
        meta: { 
          globalFormId: '0x2C123456',
          type: 'SPEL',
          plugin: 'Test.esp'
        },
        decodedData: {
          EDID: 'TestSpell01',
          FULL: 'Test Spell 1'
        }
      }
    ];

    const result = findByFormId(records, '0x2C999999');
    expect(result).toBeNull();
  });

  it('should return null for empty record set', () => {
    const result = findByFormId([], '0x2C123456');
    expect(result).toBeNull();
  });

  it('should handle records without meta.globalFormId gracefully', () => {
    const records = [
      {
        meta: { 
          globalFormId: '0x2C123456',
          type: 'SPEL',
          plugin: 'Test.esp'
        },
        decodedData: {
          EDID: 'TestSpell01',
          FULL: 'Test Spell 1'
        }
      },
      {
        meta: { 
          type: 'SPEL',
          plugin: 'Test.esp'
          // Missing globalFormId
        },
        decodedData: {
          EDID: 'TestSpell02',
          FULL: 'Test Spell 2'
        }
      }
    ];

    const result = findByFormId(records, '0x2C123456');
    expect(result).toEqual({
      meta: { 
        globalFormId: '0x2C123456',
        type: 'SPEL',
        plugin: 'Test.esp'
      },
      decodedData: {
        EDID: 'TestSpell01',
        FULL: 'Test Spell 1'
      }
    });
  });

  it('should handle case-insensitive formId matching', () => {
    const records = [
      {
        meta: { 
          globalFormId: '0x2C123456',
          type: 'SPEL',
          plugin: 'Test.esp'
        },
        decodedData: {
          EDID: 'TestSpell01',
          FULL: 'Test Spell 1'
        }
      }
    ];

    const result = findByFormId(records, '0x2c123456');
    expect(result).toEqual({
      meta: { 
        globalFormId: '0x2C123456',
        type: 'SPEL',
        plugin: 'Test.esp'
      },
      decodedData: {
        EDID: 'TestSpell01',
        FULL: 'Test Spell 1'
      }
    });
  });
}); 