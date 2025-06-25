import { RemoveFieldsProcessorV2, RemoveFieldsConfig } from '../remove-fields-v2';

// Mock console.log to capture debug output
const originalConsoleLog = console.log;
let consoleOutput: string[] = [];

beforeEach(() => {
  consoleOutput = [];
  console.log = jest.fn((...args) => {
    consoleOutput.push(args.join(' '));
    originalConsoleLog(...args);
  });
});

afterEach(() => {
  console.log = originalConsoleLog;
});

describe('RemoveFieldsProcessorV2', () => {
  let processor: RemoveFieldsProcessorV2;

  beforeEach(() => {
    processor = new RemoveFieldsProcessorV2();
  });

  describe('Basic field removal', () => {
    it('should remove simple fields', () => {
      const data = [
        { id: 1, name: 'test', extra: 'data' },
        { id: 2, name: 'test2', extra: 'data2' },
      ];

      const config: RemoveFieldsConfig = {
        remove_fields: ['extra'],
      };

      const result = processor.process(data, config);

      expect(result).toEqual([
        { id: 1, name: 'test' },
        { id: 2, name: 'test2' },
      ]);
    });

    it('should remove nested fields', () => {
      const data = [
        {
          id: 1,
          nested: {
            value: 'test',
            extra: 'data',
          },
        },
      ];

      const config: RemoveFieldsConfig = {
        remove_fields: ['nested.extra'],
      };

      const result = processor.process(data, config);

      expect(result).toEqual([
        {
          id: 1,
          nested: {
            value: 'test',
          },
        },
      ]);
    });

    it('should handle fields that do not exist', () => {
      const data = [{ id: 1, name: 'test' }];

      const config: RemoveFieldsConfig = {
        remove_fields: ['nonexistent', 'deeply.nested.field'],
      };

      const result = processor.process(data, config);

      expect(result).toEqual([{ id: 1, name: 'test' }]);
    });
  });

  describe('Array field removal', () => {
    it('should remove fields from array elements', () => {
      const data = [
        {
          id: 1,
          items: [
            { name: 'item1', extra: 'data1' },
            { name: 'item2', extra: 'data2' },
          ],
        },
      ];

      const config: RemoveFieldsConfig = {
        remove_fields: ['items[].extra'],
      };

      const result = processor.process(data, config);

      expect(result).toEqual([
        {
          id: 1,
          items: [{ name: 'item1' }, { name: 'item2' }],
        },
      ]);
    });

    it('should remove entire array elements', () => {
      const data = [
        {
          id: 1,
          items: [
            { name: 'item1', keep: true },
            { name: 'item2', remove: true },
          ],
        },
      ];

      const config: RemoveFieldsConfig = {
        remove_fields: ['items[]'],
      };

      const result = processor.process(data, config);

      expect(result).toEqual([
        {
          id: 1,
          items: [],
        },
      ]);
    });

    it('should handle nested arrays', () => {
      const data = [
        {
          id: 1,
          sections: [
            {
              name: 'section1',
              items: [
                { name: 'item1', extra: 'data1' },
                { name: 'item2', extra: 'data2' },
              ],
            },
          ],
        },
      ];

      const config: RemoveFieldsConfig = {
        remove_fields: ['sections[].items[].extra'],
      };

      const result = processor.process(data, config);

      expect(result).toEqual([
        {
          id: 1,
          sections: [
            {
              name: 'section1',
              items: [{ name: 'item1' }, { name: 'item2' }],
            },
          ],
        },
      ]);
    });
  });

  describe('Conditional processing', () => {
    it('should only process records that match condition', () => {
      const data = [
        { id: 1, type: 'perk', extra: 'data1' },
        { id: 2, type: 'spell', extra: 'data2' },
        { id: 3, type: 'perk', extra: 'data3' },
      ];

      const config: RemoveFieldsConfig = {
        remove_fields: ['extra'],
        condition: {
          field: 'type',
          value: 'perk',
        },
      };

      const result = processor.process(data, config);

      expect(result).toEqual([
        { id: 1, type: 'perk' },
        { id: 2, type: 'spell', extra: 'data2' },
        { id: 3, type: 'perk' },
      ]);
    });

    it('should handle nested condition fields', () => {
      const data = [
        {
          id: 1,
          header: { type: 'perk' },
          extra: 'data1',
        },
        {
          id: 2,
          header: { type: 'spell' },
          extra: 'data2',
        },
      ];

      const config: RemoveFieldsConfig = {
        remove_fields: ['extra'],
        condition: {
          field: 'header.type',
          value: 'perk',
        },
      };

      const result = processor.process(data, config);

      expect(result).toEqual([
        {
          id: 1,
          header: { type: 'perk' },
        },
        {
          id: 2,
          header: { type: 'spell' },
          extra: 'data2',
        },
      ]);
    });
  });

  describe('Skyrim-specific examples', () => {
    it('should handle PERK record structure', () => {
      const data = [
        {
          id: 1,
          FULL: 'Perk Name',
          CTDA: [
            { operator: 'op1', comparisonValue: 1, function: 'func1' },
            { operator: 'op2', comparisonValue: 2, function: 'func2' },
          ],
          perkSections: [
            {
              PNAM: { PERK: { FULL: 'Related Perk' } },
              DATA: { rank: 1 },
            },
          ],
        },
      ];

      const config: RemoveFieldsConfig = {
        remove_fields: [
          'FULL',
          'CTDA[].operator',
          'CTDA[].comparisonValue',
          'perkSections[].PNAM.PERK.FULL',
        ],
      };

      const result = processor.process(data, config);

      expect(result).toEqual([
        {
          id: 1,
          CTDA: [{ function: 'func1' }, { function: 'func2' }],
          perkSections: [
            {
              PNAM: { PERK: {} },
              DATA: { rank: 1 },
            },
          ],
        },
      ]);
    });

    it('should handle AVIF record structure', () => {
      const data = [
        {
          id: 1,
          FULL: 'Actor Value',
          DATA: {
            baseCost: 10,
            relatedID: 123,
            keepField: 'important',
          },
        },
      ];

      const config: RemoveFieldsConfig = {
        remove_fields: ['FULL', 'DATA.baseCost', 'DATA.relatedID'],
      };

      const result = processor.process(data, config);

      expect(result).toEqual([
        {
          id: 1,
          DATA: {
            keepField: 'important',
          },
        },
      ]);
    });
  });

  describe('Edge cases', () => {
    it('should handle empty data array', () => {
      const data: any[] = [];
      const config: RemoveFieldsConfig = {
        remove_fields: ['field'],
      };

      const result = processor.process(data, config);

      expect(result).toEqual([]);
    });

    it('should handle empty remove_fields array', () => {
      const data = [{ id: 1, name: 'test' }];
      const config: RemoveFieldsConfig = {
        remove_fields: [],
      };

      const result = processor.process(data, config);

      expect(result).toEqual([{ id: 1, name: 'test' }]);
    });

    it('should handle null/undefined values in data', () => {
      const data = [
        { id: 1, name: 'test', extra: 'data' },
        null,
        { id: 2, name: 'test2', extra: 'data2' },
      ];

      const config: RemoveFieldsConfig = {
        remove_fields: ['extra'],
      };

      const result = processor.process(data, config);

      expect(result).toEqual([{ id: 1, name: 'test' }, null, { id: 2, name: 'test2' }]);
    });

    it('should not mutate original data', () => {
      const data = [{ id: 1, name: 'test', extra: 'data' }];

      const config: RemoveFieldsConfig = {
        remove_fields: ['extra'],
      };

      const originalData = JSON.parse(JSON.stringify(data));
      const result = processor.process(data, config);

      expect(data).toEqual(originalData);
      expect(result).not.toBe(data);
    });
  });

  describe('Debug logging', () => {
    it('should log processing information', () => {
      const data = [{ id: 1, extra: 'data' }];
      const config: RemoveFieldsConfig = {
        remove_fields: ['extra'],
      };

      processor.process(data, config);

      expect(consoleOutput).toContain('[RemoveFieldsV2] Processing 1 records');
      expect(consoleOutput).toContain('[RemoveFieldsV2] Fields to remove:');
      expect(consoleOutput).toContain('[RemoveFieldsV2] Processing field path: extra for record 0');
    });
  });
});
