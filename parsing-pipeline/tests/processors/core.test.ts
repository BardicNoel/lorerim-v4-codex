import '@jest/globals';
import { createProcessor, createPipeline } from '../../src/processors/core';
import { StageConfig, JsonArray, RemoveFieldsConfig } from '../../src/types/pipeline';
import { ParsedRecord } from '@lorerim/platform-types';

describe('Core Processors', () => {
  const testData: JsonArray = [
    {
      meta: {
        type: 'MGEF',
        formId: '0x12345678',
        plugin: 'test.esp',
        stackOrder: 0,
      },
      data: {
        DATA: ['test data'],
        SNDD: ['sound data'],
      },
      header: 'base64encodedheader',
    },
  ];

  describe('Filter Records Processor', () => {
    it('should filter records based on conditions', async () => {
      const stage: StageConfig = {
        name: 'filter-active',
        type: 'filter-records',
        criteria: [
          {
            field: 'meta.type',
            operator: 'equals',
            value: 'MGEF',
          },
        ],
      };

      const processor = createProcessor(stage);
      const result = await processor.transform(testData);

      expect(result).toHaveLength(1);
      expect((result[0] as ParsedRecord).meta.type).toBe('MGEF');
    });
  });

  describe('Remove Fields Processor', () => {
    it('should remove specified fields from records', async () => {
      const stage: StageConfig = {
        name: 'remove-fields',
        type: 'remove-fields',
        fields: ['data.SNDD'],
      };

      const processor = createProcessor(stage);
      const result = await processor.transform(testData);

      // Check that the fields are removed from the first record
      const firstRecord = result[0] as ParsedRecord;
      expect(firstRecord.data).not.toHaveProperty('SNDD');
      expect(firstRecord.data).toHaveProperty('DATA');
    });

    it('should handle nested field removal with all value', async () => {
      const stage: RemoveFieldsConfig = {
        name: 'remove-fields',
        type: 'remove-fields',
        fields: {
          data: {
            DATA: 'all',
            SNDD: 'all',
          },
        },
      };

      const processor = createProcessor(stage);
      const result = await processor.transform(testData);

      const record = result[0] as ParsedRecord;

      // Check that all data fields are removed
      expect(record.data).not.toHaveProperty('DATA');
      expect(record.data).not.toHaveProperty('SNDD');
    });
  });

  describe('Keep Fields Processor', () => {
    it('should keep only specified fields in records', async () => {
      const stage: StageConfig = {
        name: 'keep-fields',
        type: 'keep-fields',
        fields: ['meta.type', 'meta.formId'],
      };

      const processor = createProcessor(stage);
      const result = await processor.transform(testData);

      const record = result[0] as ParsedRecord;
      expect(record.meta).toHaveProperty('type');
      expect(record.meta).toHaveProperty('formId');
      expect(record.meta).not.toHaveProperty('plugin');
      expect(record.meta).not.toHaveProperty('stackOrder');
    });
  });

  describe('Sanitize Fields Processor', () => {
    it('should sanitize fields based on patterns', async () => {
      const stage: StageConfig = {
        name: 'sanitize-fields',
        type: 'sanitize-fields',
        rules: [
          {
            pattern: 'test.esp',
            action: 'replace',
            replacement: 'sanitized.esp',
          },
        ],
      };

      const processor = createProcessor(stage);
      const result = await processor.transform(testData);

      const record = result[0] as ParsedRecord;
      expect(record.meta.plugin).toBe('sanitized.esp');
    });
  });

  describe('Pipeline Creation', () => {
    it('should process data through multiple stages', async () => {
      const stages: StageConfig[] = [
        {
          name: 'filter-active',
          type: 'filter-records',
          criteria: [
            {
              field: 'meta.type',
              operator: 'equals',
              value: 'MGEF',
            },
          ],
        },
        {
          name: 'remove-fields',
          type: 'remove-fields',
          fields: ['data.SNDD'],
        },
      ];

      const pipeline = createPipeline(stages);
      const result = await pipeline.transform(testData);

      expect(result).toHaveLength(1);
      const record = result[0] as ParsedRecord;
      expect(record.meta.type).toBe('MGEF');
      expect(record.data).not.toHaveProperty('SNDD');
      expect(record.data).toHaveProperty('DATA');
    });

    it('should throw error for unknown stage type', () => {
      const stage = {
        name: 'unknown',
        type: 'unknown-type' as any,
        criteria: [],
      };

      expect(() => createProcessor(stage)).toThrow('Unknown stage type: unknown-type');
    });
  });
});
