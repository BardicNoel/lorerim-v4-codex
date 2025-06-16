import { PluginMeta } from "../types";
import { ParsedRecord } from "@lorerim/platform-types";
import { AggregatorConfig, AggregationResult } from "./types";
import { debugLog } from "../utils/debugUtils";
import { StatsCollector, ProcessingStats } from "../utils/stats";

export class RecordAggregator {
  private plugins: PluginMeta[];
  private recordMap: Map<string, ParsedRecord[]> = new Map();
  private allRecords: ParsedRecord[] = [];
  private statsCollector: StatsCollector;

  constructor(config: AggregatorConfig) {
    this.plugins = config.plugins;
    this.statsCollector = new StatsCollector();
  }

  /**
   * Process a batch of records from a plugin
   * @param pluginIndex The index of the plugin in the load order
   * @param records The records to process
   */
  public processPluginRecords(
    pluginIndex: number,
    records: ParsedRecord[]
  ): void {
    debugLog(
      `\n[recordAggregator] Processing ${records.length} records from plugin index ${pluginIndex}`
    );

    for (const record of records) {
      const formId = record.meta.formId;
      const type = record.meta.type;

      // Initialize array for this FormID if we haven't seen it before
      if (!this.recordMap.has(formId)) {
        this.recordMap.set(formId, []);
      }

      // Get the current stack for this FormID
      const stack = this.recordMap.get(formId)!;

      // Set the stack order (0 being the highest version)
      record.meta.stackOrder = stack.length;

      // Add to the stack
      stack.push(record);

      // Add all records to allRecords, not just winning overrides
      this.allRecords.push(record);

      // Record stats with default size of 100 bytes per record
      this.statsCollector.recordProcessed(type, 100);
      debugLog(
        `[recordAggregator] Added record for ${formId} (type: ${type}, stack order: ${record.meta.stackOrder})`
      );
    }

    // Record plugin processed
    this.statsCollector.recordPluginProcessed();
  }

  /**
   * Get all processed records
   */
  public getRecords(): ParsedRecord[] {
    return this.allRecords;
  }

  /**
   * Get statistics about processed records
   */
  public getStats(): ProcessingStats {
    return this.statsCollector.getStats();
  }

  /**
   * Clear all records and stats
   */
  public clear(): void {
    this.recordMap.clear();
    this.allRecords = [];
    this.statsCollector = new StatsCollector();
  }

  /**
   * Record an error in the stats
   */
  public recordError(errorType: string): void {
    this.statsCollector.recordError(errorType);
  }

  /**
   * Record a skipped record in the stats
   */
  public recordSkipped(recordType: string, size: number): void {
    this.statsCollector.recordSkipped(recordType, size);
  }

  /**
   * Get the final aggregation result
   */
  public getResult(): AggregationResult {
    return {
      records: this.allRecords,
      recordStacks: this.recordMap,
    };
  }
}
