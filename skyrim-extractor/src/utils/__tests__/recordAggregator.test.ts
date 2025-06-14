import { createRecordAggregator } from '../recordAggregator';
import { ParsedRecord } from '../../types';

describe('RecordAggregator', () => {
  let aggregator: ReturnType<typeof createRecordAggregator>;

  beforeEach(() => {
    aggregator = createRecordAggregator();
  });

  describe('addRecord', () => {
    it('should group records by type', () => {
      const perkRecord: ParsedRecord = {
        meta: {
          type: 'PERK',
          formId: '00058F80',
          plugin: 'test.esp'
        },
        data: {},
        header: 'base64header'
      };

      const raceRecord: ParsedRecord = {
        meta: {
          type: 'RACE',
          formId: '00058F81',
          plugin: 'test.esp'
        },
        data: {},
        header: 'base64header'
      };

      aggregator.addRecord(perkRecord);
      aggregator.addRecord(raceRecord);

      const records = aggregator.getRecords();
      expect(Object.keys(records)).toEqual(['PERK', 'RACE']);
      expect(records.PERK).toHaveLength(1);
      expect(records.RACE).toHaveLength(1);
    });

    it('should handle multiple records of the same type', () => {
      const records: ParsedRecord[] = [
        {
          meta: { type: 'PERK', formId: '00058F80', plugin: 'test.esp' },
          data: {},
          header: 'base64header'
        },
        {
          meta: { type: 'PERK', formId: '00058F81', plugin: 'test.esp' },
          data: {},
          header: 'base64header'
        }
      ];

      records.forEach(record => aggregator.addRecord(record));

      const groupedRecords = aggregator.getRecords();
      expect(groupedRecords.PERK).toHaveLength(2);
    });
  });

  describe('getRecords', () => {
    it('should return a copy of records', () => {
      const record: ParsedRecord = {
        meta: { type: 'PERK', formId: '00058F80', plugin: 'test.esp' },
        data: {},
        header: 'base64header'
      };

      aggregator.addRecord(record);
      const records1 = aggregator.getRecords();
      const records2 = aggregator.getRecords();

      expect(records1).toEqual(records2);
      expect(records1.PERK).not.toBe(records2.PERK); // Should be different arrays
    });

    it('should return empty object when no records', () => {
      const records = aggregator.getRecords();
      expect(records).toEqual({});
    });
  });

  describe('getStats', () => {
    it('should return a copy of stats', () => {
      const record: ParsedRecord = {
        meta: { type: 'PERK', formId: '00058F80', plugin: 'test.esp' },
        data: {},
        header: 'base64header'
      };

      aggregator.addRecord(record);
      const stats1 = aggregator.getStats();
      const stats2 = aggregator.getStats();

      expect(stats1).toEqual({ PERK: 1 });
      expect(stats1).not.toBe(stats2); // Should be different objects
    });

    it('should return empty object when no records', () => {
      const stats = aggregator.getStats();
      expect(stats).toEqual({});
    });
  });

  describe('clear', () => {
    it('should clear all records and stats', () => {
      const record: ParsedRecord = {
        meta: { type: 'PERK', formId: '00058F80', plugin: 'test.esp' },
        data: {},
        header: 'base64header'
      };

      aggregator.addRecord(record);
      aggregator.clear();

      expect(aggregator.getRecords()).toEqual({});
      expect(aggregator.getStats()).toEqual({});
    });
  });
}); 