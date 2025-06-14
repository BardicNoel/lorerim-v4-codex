import { commonFieldSchemas, sharedFields, recordSpecificSchemas } from '../schemas';
import { FieldSchema, StructFieldSchema } from '../types';

describe('Schemas', () => {
  describe('commonFieldSchemas', () => {
    it('should have valid string field schemas', () => {
      expect(commonFieldSchemas.EDID).toEqual({
        type: 'string',
        encoding: 'utf8'
      });

      expect(commonFieldSchemas.FULL).toEqual({
        type: 'string',
        encoding: 'utf16le'
      });

      expect(commonFieldSchemas.DESC).toEqual({
        type: 'string',
        encoding: 'utf16le'
      });
    });
  });

  describe('sharedFields', () => {
    it('should have valid flags8 schema', () => {
      expect(sharedFields.flags8).toEqual([
        { name: 'flags', type: 'uint8' }
      ]);
    });

    it('should have valid flags32 schema', () => {
      expect(sharedFields.flags32).toEqual([
        { name: 'flags', type: 'uint32' }
      ]);
    });

    it('should have valid conditionBlock schema', () => {
      expect(sharedFields.conditionBlock).toEqual([
        { name: 'op', type: 'uint8' },
        { name: 'value', type: 'float32' },
        { name: 'functionIndex', type: 'uint32' }
      ]);
    });
  });

  describe('recordSpecificSchemas', () => {
    it('should have valid PERK schema', () => {
      const perkData = recordSpecificSchemas.PERK.DATA as StructFieldSchema;
      expect(perkData.type).toBe('struct');
      expect(perkData.fields).toContainEqual({ name: 'flags', type: 'uint8' });
      expect(perkData.fields).toContainEqual({ name: 'levelReq', type: 'uint8' });
      expect(perkData.fields).toContainEqual({ name: 'numPRKE', type: 'uint8' });
    });

    it('should have valid CELL schema', () => {
      const cellData = recordSpecificSchemas.CELL.DATA as StructFieldSchema;
      expect(cellData.type).toBe('struct');
      expect(cellData.fields).toContainEqual({ name: 'flags', type: 'uint32' });
      expect(cellData.fields).toContainEqual({ name: 'lightLevel', type: 'uint8' });
    });

    it('should have valid SPEL schema', () => {
      const spelData = recordSpecificSchemas.SPEL.DATA as StructFieldSchema;
      expect(spelData.type).toBe('struct');
      expect(spelData.fields).toContainEqual({ name: 'spellType', type: 'uint32' });
      expect(spelData.fields).toContainEqual({ name: 'cost', type: 'uint32' });
      expect(spelData.fields).toContainEqual({ name: 'op', type: 'uint8' });
      expect(spelData.fields).toContainEqual({ name: 'value', type: 'float32' });
      expect(spelData.fields).toContainEqual({ name: 'functionIndex', type: 'uint32' });
    });
  });
}); 