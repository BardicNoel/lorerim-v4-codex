import '@jest/globals';
import { createProcessor, createPipeline } from '../../src/processors/core';
import { StageConfig, JsonArray, JsonObject, JsonValue } from '../../src/types/pipeline';

describe('Core Processors', () => {
  const testData: JsonArray = [
    {
      id: 1,
      name: 'Test 1',
      status: 'active',
      email: 'test1@example.com',
      internalId: 'INT-001',
      metadata: { tags: ['test'] as unknown as JsonValue }
    },
    {
      id: 2,
      name: 'Test 2',
      status: 'inactive',
      email: 'test2@example.com',
      internalId: 'INT-002',
      metadata: { tags: ['test'] as unknown as JsonValue }
    }
  ];

  describe('Filter Records Processor', () => {
    it('should filter records based on conditions', async () => {
      const stage: StageConfig = {
        name: 'filter-active',
        type: 'filter-records',
        criteria: [
          {
            field: 'status',
            operator: 'equals',
            value: 'active'
          }
        ]
      };

      const processor = createProcessor(stage);
      const result = await processor.transform(testData);

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('active');
    });
  });

  describe('Remove Fields Processor', () => {
    it('should remove specified fields from records', async () => {
      const stage: StageConfig = {
        name: 'remove-fields',
        type: 'remove-fields',
        fields: ['internalId', 'metadata']
      };

      const processor = createProcessor(stage);
      const result = await processor.transform(testData);

      // Check that the fields are removed from the first record
      const firstRecord = result[0];
      expect(firstRecord).not.toHaveProperty('internalId');
      expect(firstRecord).not.toHaveProperty('metadata');
      expect(firstRecord).toHaveProperty('name');
      expect(firstRecord).toHaveProperty('status');

      // Check that the fields are removed from the second record
      const secondRecord = result[1];
      expect(secondRecord).not.toHaveProperty('internalId');
      expect(secondRecord).not.toHaveProperty('metadata');
      expect(secondRecord).toHaveProperty('name');
      expect(secondRecord).toHaveProperty('status');
    });
  });

  describe('Keep Fields Processor', () => {
    it('should keep only specified fields in records', async () => {
      const stage: StageConfig = {
        name: 'keep-fields',
        type: 'keep-fields',
        fields: ['id', 'name']
      };

      const processor = createProcessor(stage);
      const result = await processor.transform(testData);

      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('name');
      expect(result[0]).not.toHaveProperty('status');
      expect(result[0]).not.toHaveProperty('email');
    });
  });

  describe('Sanitize Fields Processor', () => {
    it('should sanitize fields based on patterns', async () => {
      const stage: StageConfig = {
        name: 'sanitize-fields',
        type: 'sanitize-fields',
        rules: [
          {
            pattern: '@example.com',
            action: 'replace',
            replacement: '@test.com'
          }
        ]
      };

      const processor = createProcessor(stage);
      const result = await processor.transform(testData);

      // The sanitize processor replaces the entire value with the replacement
      expect(result[0].email).toBe('@test.com');
      expect(result[1].email).toBe('@test.com');
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
              field: 'status',
              operator: 'equals',
              value: 'active'
            }
          ]
        },
        {
          name: 'remove-fields',
          type: 'remove-fields',
          fields: ['internalId', 'metadata']
        }
      ];

      const pipeline = createPipeline(stages);
      const result = await pipeline.transform(testData);

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('active');
      expect(result[0]).not.toHaveProperty('internalId');
      expect(result[0]).not.toHaveProperty('metadata');
    });

    it('should throw error for unknown stage type', () => {
      const stage = {
        name: 'unknown',
        type: 'unknown-type' as any,
        criteria: []
      };

      expect(() => createProcessor(stage)).toThrow('Unknown stage type: unknown-type');
    });
  });
}); 