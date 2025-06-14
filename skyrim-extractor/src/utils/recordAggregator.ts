import { ParsedRecord } from '../types';

interface RecordAggregator {
  addRecord(record: ParsedRecord): void;
  getRecords(): Record<string, ParsedRecord[]>;
  getStats(): Record<string, number>;
  clear(): void;
}

class RecordAggregatorImpl implements RecordAggregator {
  private records: Map<string, ParsedRecord[]> = new Map();
  private stats: Record<string, number> = {};

  /**
   * Add a record to the appropriate type group
   */
  addRecord(record: ParsedRecord): void {
    const { type } = record.meta;
    if (!this.records.has(type)) {
      this.records.set(type, []);
      this.stats[type] = 0;
    }
    this.records.get(type)!.push(record);
    this.stats[type]++;
  }

  /**
   * Get all records grouped by type
   */
  getRecords(): Record<string, ParsedRecord[]> {
    const result: Record<string, ParsedRecord[]> = {};
    for (const [type, records] of this.records) {
      result[type] = [...records];
    }
    return result;
  }

  /**
   * Get statistics about processed records
   */
  getStats(): Record<string, number> {
    return { ...this.stats };
  }

  /**
   * Clear all records and stats
   */
  clear(): void {
    this.records.clear();
    this.stats = {};
  }
}

/**
 * Create a new record aggregator instance
 */
export function createRecordAggregator(): RecordAggregator {
  return new RecordAggregatorImpl();
} 