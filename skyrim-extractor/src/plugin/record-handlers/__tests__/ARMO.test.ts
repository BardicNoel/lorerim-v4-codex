import { describe, it, expect } from 'vitest';
import { parseARMO, ARMO_SCHEMA } from '../ARMO';
import { Buffer } from 'buffer';

describe('ARMO Record Handler', () => {
  // Helper function to create a subrecord buffer
  const createSubrecord = (type: string, data: Buffer): Buffer => {
    const header = Buffer.alloc(6);
    header.write(type, 0, 4, 'ascii');
    header.writeUInt16LE(data.length, 4);
    return Buffer.concat([header, data]);
  };

  // Helper function to create a string subrecord
  const createStringSubrecord = (type: string, value: string): Buffer => {
    const data = Buffer.from(value + '\0', 'utf8');
    return createSubrecord(type, data);
  };

  it('should parse a basic armor record', () => {
    // Create test data for a basic iron helmet
    const subrecords = [
      createStringSubrecord('EDID', 'IronHelmet'),
      createStringSubrecord('FULL', 'Iron Helmet'),
      createSubrecord('BMDT', Buffer.from([
        0x01, 0x00, 0x00, 0x00, // bipedFlags
        0x00, 0x00, 0x00, 0x00, // generalFlags
        0x00, 0x00, 0x00, 0x00  // unknown
      ])),
      createSubrecord('DNAM', Buffer.from([
        0x0A, 0x00, 0x00, 0x00, // value
        0x64, 0x00, 0x00, 0x00, // maxCondition
        0x00, 0x00, 0xA0, 0x40  // weight (5.0)
      ])),
      createStringSubrecord('MODL', 'armor/iron/helmet.nif'),
      createStringSubrecord('ICON', 'armor/iron/helmet.dds')
    ];

    const recordBuffer = Buffer.concat(subrecords);
    const meta = {
      plugin: 'Skyrim.esm',
      loadOrder: 0,
      recordType: 'ARMO',
      formId: '00001234',
      fullFormId: '00001234',
      uniqueId: 'Skyrim.esm|00001234',
      winning: true,
      rawOffset: 0
    };

    const result = parseARMO(recordBuffer, meta);

    // Verify the parsed record
    expect(result).toEqual({
      ...meta,
      parsed: {
        EDID: 'IronHelmet',
        FULL: 'Iron Helmet',
        BMDT: {
          bipedFlags: 1,
          generalFlags: 0,
          unknown: 0
        },
        DNAM: {
          value: 10,
          maxCondition: 100,
          weight: 5.0
        },
        MODL: 'armor/iron/helmet.nif',
        ICON: 'armor/iron/helmet.dds'
      }
    });
  });

  it('should handle missing optional fields', () => {
    // Create test data with only required fields
    const subrecords = [
      createStringSubrecord('EDID', 'IronHelmet'),
      createStringSubrecord('FULL', 'Iron Helmet')
    ];

    const recordBuffer = Buffer.concat(subrecords);
    const meta = {
      plugin: 'Skyrim.esm',
      loadOrder: 0,
      recordType: 'ARMO',
      formId: '00001234',
      fullFormId: '00001234',
      uniqueId: 'Skyrim.esm|00001234',
      winning: true,
      rawOffset: 0
    };

    const result = parseARMO(recordBuffer, meta);

    // Verify the parsed record has only the fields we provided
    expect(result).toEqual({
      ...meta,
      parsed: {
        EDID: 'IronHelmet',
        FULL: 'Iron Helmet'
      }
    });
  });

  it('should handle malformed subrecords', () => {
    // Create test data with a malformed BMDT subrecord (too short)
    const subrecords = [
      createStringSubrecord('EDID', 'IronHelmet'),
      createSubrecord('BMDT', Buffer.from([0x01, 0x00])) // Too short for BMDT
    ];

    const recordBuffer = Buffer.concat(subrecords);
    const meta = {
      plugin: 'Skyrim.esm',
      loadOrder: 0,
      recordType: 'ARMO',
      formId: '00001234',
      fullFormId: '00001234',
      uniqueId: 'Skyrim.esm|00001234',
      winning: true,
      rawOffset: 0
    };

    // Should not throw, but should skip the malformed subrecord
    const result = parseARMO(recordBuffer, meta);
    expect(result.parsed.EDID).toBe('IronHelmet');
    expect(result.parsed.BMDT).toBeUndefined();
  });
}); 