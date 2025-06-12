import { describe, it, expect } from 'vitest';
import { parseCOBJ, COBJ_SCHEMA } from '../COBJ.js';
import { Buffer } from 'buffer';

describe('COBJ Record Handler', () => {
  it('should parse a valid COBJ record', () => {
    // Create a test buffer with all COBJ subrecords
    const buffer = Buffer.concat([
      // EDID - Editor ID
      Buffer.from('EDID'),
      Buffer.from([0x0C, 0x00]), // size
      Buffer.from('TestRecipe\0'),
      
      // CNAM - Workbench keyword
      Buffer.from('CNAM'),
      Buffer.from([0x04, 0x00]), // size
      Buffer.from([0x01, 0x00, 0x00, 0x00]), // formId
      
      // BNAM - Crafting station
      Buffer.from('BNAM'),
      Buffer.from([0x04, 0x00]), // size
      Buffer.from([0x02, 0x00, 0x00, 0x00]), // formId
      
      // FNAM - Created item
      Buffer.from('FNAM'),
      Buffer.from([0x04, 0x00]), // size
      Buffer.from([0x03, 0x00, 0x00, 0x00]), // formId
      
      // INTV - Creation count
      Buffer.from('INTV'),
      Buffer.from([0x04, 0x00]), // size
      Buffer.from([0x01, 0x00, 0x00, 0x00]), // count
      
      // NAM1 - First required item
      Buffer.from('NAM1'),
      Buffer.from([0x04, 0x00]), // size
      Buffer.from([0x04, 0x00, 0x00, 0x00]), // formId
      
      // NAM2 - Second required item
      Buffer.from('NAM2'),
      Buffer.from([0x04, 0x00]), // size
      Buffer.from([0x05, 0x00, 0x00, 0x00]) // formId
    ]);

    const meta = {
      plugin: 'test.esp',
      loadOrder: 0,
      recordType: 'COBJ',
      formId: '00000001',
      fullFormId: '00000001',
      uniqueId: 'test.esp|00000001',
      winning: true,
      rawOffset: 0
    };

    const result = parseCOBJ(buffer, meta);

    expect(result.parsed).toEqual({
      EDID: 'TestRecipe',
      CNAM: 0x00000001,
      BNAM: 0x00000002,
      FNAM: 0x00000003,
      INTV: 1,
      NAM1: 0x00000004,
      NAM2: 0x00000005
    });
  });

  it('should handle missing optional fields', () => {
    const buffer = Buffer.concat([
      // EDID - Editor ID
      Buffer.from('EDID'),
      Buffer.from([0x0C, 0x00]), // size
      Buffer.from('TestRecipe\0')
    ]);

    const meta = {
      plugin: 'test.esp',
      loadOrder: 0,
      recordType: 'COBJ',
      formId: '00000001',
      fullFormId: '00000001',
      uniqueId: 'test.esp|00000001',
      winning: true,
      rawOffset: 0
    };

    const result = parseCOBJ(buffer, meta);

    expect(result.parsed).toEqual({
      EDID: 'TestRecipe'
    });
  });

  it('should handle malformed subrecords', () => {
    const buffer = Buffer.concat([
      // EDID - Editor ID
      Buffer.from('EDID'),
      Buffer.from([0x0C, 0x00]), // size
      Buffer.from('TestRecipe\0'),
      
      // Malformed CNAM
      Buffer.from('CNAM'),
      Buffer.from([0x02, 0x00]), // size too small
      Buffer.from([0x01, 0x02]),
      
      // Malformed INTV
      Buffer.from('INTV'),
      Buffer.from([0x01, 0x00]), // size too small
      Buffer.from([0x01])
    ]);

    const meta = {
      plugin: 'test.esp',
      loadOrder: 0,
      recordType: 'COBJ',
      formId: '00000001',
      fullFormId: '00000001',
      uniqueId: 'test.esp|00000001',
      winning: true,
      rawOffset: 0
    };

    const result = parseCOBJ(buffer, meta);

    expect(result.parsed).toEqual({
      EDID: 'TestRecipe'
    });
  });
}); 