import { createExtractFieldProcessor } from '../extract-field';

describe('ExtractFieldProcessor', () => {
  const sampleData = [
    {
      meta: { isWinner: true, plugin: 'Wintersun.esp' },
      decodedData: {
        VMAD: {
          scripts: [
            {
              properties: [
                { name: 'WSN_DeityName', value: 'Akatosh' },
                { name: 'WSN_DeityDescription', value: 'Dragon God of Time' },
              ],
            },
          ],
        },
      },
    },
  ];

  describe('Root Mode (Default)', () => {
    it('should extract fields to root level', async () => {
      const processor = createExtractFieldProcessor({
        name: 'test',
        type: 'extract-field',
        field: 'decodedData.VMAD.scripts[0].properties',
        outputMode: 'root',
      });

      const result = await processor.transform(sampleData);
      const stats = processor.getStats?.();

      expect(result).toEqual([
        { name: 'WSN_DeityName', value: 'Akatosh' },
        { name: 'WSN_DeityDescription', value: 'Dragon God of Time' },
      ]);
      expect(stats?.recordsProcessed).toBe(1);
      expect(stats?.fieldsExtracted).toBe(2);
    });
  });

  describe('Sibling Mode', () => {
    it('should extract fields to sibling level with array flattening', async () => {
      const processor = createExtractFieldProcessor({
        name: 'test',
        type: 'extract-field',
        field: 'decodedData.VMAD.scripts[0].properties',
        outputMode: 'sibling',
        preserveSource: false,
      });

      const result = await processor.transform(sampleData);
      const stats = processor.getStats?.();

      // Check that we have two records (one for each property)
      expect(result).toHaveLength(2);

      // Check first record
      expect(result[0]).toHaveProperty('meta');
      expect(result[0]).toHaveProperty('decodedData');
      expect(result[0]).toHaveProperty('properties');
      expect(result[0].properties).toEqual({ name: 'WSN_DeityName', value: 'Akatosh' });

      // Check second record
      expect(result[1]).toHaveProperty('meta');
      expect(result[1]).toHaveProperty('decodedData');
      expect(result[1]).toHaveProperty('properties');
      expect(result[1].properties).toEqual({
        name: 'WSN_DeityDescription',
        value: 'Dragon God of Time',
      });

      expect(stats?.recordsProcessed).toBe(1);
      expect(stats?.fieldsExtracted).toBe(2);
    });

    it('should preserve source when preserveSource is true', async () => {
      const processor = createExtractFieldProcessor({
        name: 'test',
        type: 'extract-field',
        field: 'decodedData.VMAD.scripts[0].properties',
        outputMode: 'sibling',
        preserveSource: true,
      });

      const result = await processor.transform(sampleData);
      const stats = processor.getStats?.();

      expect(result[0]).toHaveProperty('meta');
      expect(result[0]).toHaveProperty('properties');
      expect(result[0]).toHaveProperty('decodedData');
      expect(result[0].decodedData.VMAD.scripts[0]).toHaveProperty('properties');
      expect(stats?.recordsProcessed).toBe(1);
      expect(stats?.fieldsExtracted).toBe(2);
    });
  });

  describe('Custom Mode', () => {
    it('should extract fields to custom path with array flattening', async () => {
      const processor = createExtractFieldProcessor({
        name: 'test',
        type: 'extract-field',
        field: 'decodedData.VMAD.scripts[0].properties',
        outputMode: 'custom',
        outputPath: 'extractedProperties',
        preserveSource: false,
      });

      const result = await processor.transform(sampleData);
      const stats = processor.getStats?.();

      expect(result[0]).toHaveProperty('meta');
      expect(result[0]).toHaveProperty('extractedProperties');
      expect(result[0].extractedProperties).toEqual({ name: 'WSN_DeityName', value: 'Akatosh' });
      expect(result[1].extractedProperties).toEqual({
        name: 'WSN_DeityDescription',
        value: 'Dragon God of Time',
      });
      expect(stats?.recordsProcessed).toBe(1);
      expect(stats?.fieldsExtracted).toBe(2);
    });
  });

  describe('Array Flattening', () => {
    it('should not flatten arrays when flattenArrays is false', async () => {
      const processor = createExtractFieldProcessor({
        name: 'test',
        type: 'extract-field',
        field: 'decodedData.VMAD.scripts[0].properties',
        outputMode: 'sibling',
        flattenArrays: false,
      });

      const result = await processor.transform(sampleData);
      const stats = processor.getStats?.();

      expect(result[0].properties).toEqual([
        { name: 'WSN_DeityName', value: 'Akatosh' },
        { name: 'WSN_DeityDescription', value: 'Dragon God of Time' },
      ]);
      expect(stats?.recordsProcessed).toBe(1);
      expect(stats?.fieldsExtracted).toBe(1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing fields gracefully', async () => {
      const processor = createExtractFieldProcessor({
        name: 'test',
        type: 'extract-field',
        field: 'decodedData.VMAD.scripts[0].nonexistent',
        outputMode: 'sibling',
      });

      const result = await processor.transform(sampleData);
      const stats = processor.getStats?.();

      expect(result).toEqual(sampleData);
      expect(stats?.recordsProcessed).toBe(1);
      expect(stats?.fieldsExtracted).toBe(0);
    });

    it('should handle empty arrays', async () => {
      const dataWithEmptyArray = [
        {
          meta: { isWinner: true },
          decodedData: {
            VMAD: {
              scripts: [
                {
                  properties: [],
                },
              ],
            },
          },
        },
      ];

      const processor = createExtractFieldProcessor({
        name: 'test',
        type: 'extract-field',
        field: 'decodedData.VMAD.scripts[0].properties',
        outputMode: 'sibling',
        flattenArrays: false,
      });

      const result = await processor.transform(dataWithEmptyArray);
      const stats = processor.getStats?.();

      expect(result[0]).toHaveProperty('properties');
      expect(result[0].properties).toEqual([]);
      expect(stats?.recordsProcessed).toBe(1);
      expect(stats?.fieldsExtracted).toBe(1);
    });
  });
});
