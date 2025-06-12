import { describe, it, expect } from 'vitest';
import { parseGRUP, GRUP_SCHEMA } from '../GRUP.js';
import { Buffer } from 'buffer';

describe('GRUP Record Handler', () => {
  it('should parse a valid top-level GRUP record', () => {
    // Create a buffer with test data for a top-level group
    const buffer = Buffer.alloc(50);
    
    // Group header
    buffer.writeUInt32LE(0, 0); // GroupType (0 for top-level)
    buffer.writeUInt16LE(12345, 4); // Timestamp
    buffer.writeUInt32LE(67890, 6); // VersionControl
    
    // Label
    buffer.writeUInt16LE(4, 10); // Label size
    buffer.write('TEST', 12); // Label content

    const result = parseGRUP(buffer, { 
      plugin: 'test.esp',
      loadOrder: 0,
      recordType: 'GRUP',
      formId: '00000000',
      fullFormId: '00000000',
      uniqueId: 'test.esp|00000000',
      winning: true,
      rawOffset: 0
    });

    expect(result.parsed).toEqual({
      GroupType: 0,
      Timestamp: 12345,
      VersionControl: 67890,
      Label: 'TEST',
      Records: []
    });
  });

  it('should parse a valid interior GRUP record', () => {
    // Create a buffer with test data for an interior group
    const buffer = Buffer.alloc(20);
    
    // Group header
    buffer.writeUInt32LE(1, 0); // GroupType (1 for interior)
    buffer.writeUInt16LE(12345, 4); // Timestamp
    buffer.writeUInt32LE(67890, 6); // VersionControl

    const result = parseGRUP(buffer, { 
      plugin: 'test.esp',
      loadOrder: 0,
      recordType: 'GRUP',
      formId: '00000000',
      fullFormId: '00000000',
      uniqueId: 'test.esp|00000000',
      winning: true,
      rawOffset: 0
    });

    expect(result.parsed).toEqual({
      GroupType: 1,
      Timestamp: 12345,
      VersionControl: 67890,
      Records: []
    });
  });

  it('should handle malformed GRUP record', () => {
    // Create a buffer that's too small for a valid GRUP record
    const buffer = Buffer.alloc(4);
    
    // Write some invalid data
    buffer.writeUInt32LE(0, 0); // GroupType (incomplete)

    const result = parseGRUP(buffer, { 
      plugin: 'test.esp',
      loadOrder: 0,
      recordType: 'GRUP',
      formId: '00000000',
      fullFormId: '00000000',
      uniqueId: 'test.esp|00000000',
      winning: true,
      rawOffset: 0
    });

    expect(result.parsed).toEqual({
      Records: []
    });
  });
}); 