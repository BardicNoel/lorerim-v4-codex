import { ParsedRecord, PluginMeta } from "../types";
import { AggregatorConfig, AggregationResult } from "./types";
import { debugLog } from "../utils/debugUtils";

export class RecordAggregator {
  private plugins: PluginMeta[];
  private recordMap: Map<string, ParsedRecord[]>;
  private allRecords: ParsedRecord[];
  private stats: Record<string, number>;

  constructor(config: AggregatorConfig) {
    this.plugins = config.plugins;
    this.recordMap = new Map();
    this.allRecords = [];
    this.stats = {};
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
        debugLog(`[recordAggregator] New FormID ${formId} (type: ${type})`);
      }

      // Get the current stack for this FormID
      const stack = this.recordMap.get(formId)!;

      // Set the stack order (0 being the highest version)
      record.meta.stackOrder = stack.length;

      // Add to the stack
      stack.push(record);

      // Only add to allRecords if this is the winning override
      if (stack.length === 1) {
        this.allRecords.push(record);
        // Update stats
        this.stats[type] = (this.stats[type] || 0) + 1;
        debugLog(
          `[recordAggregator] Added winning override for ${formId} (type: ${type})`
        );
      } else {
        debugLog(
          `[recordAggregator] Skipping override for ${formId} (type: ${type}) - not winning`
        );
      }
    }

    // Log stats after processing
    debugLog("\n[recordAggregator] Current stats:");
    Object.entries(this.stats).forEach(([type, count]) => {
      debugLog(`  ${type}: ${count} records`);
    });
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

  /**
   * Get the plugin index for a given plugin name
   */
  private getPluginIndex(pluginName: string): number {
    const plugin = this.plugins.find((p) => p.name === pluginName);
    if (!plugin) {
      throw new Error(`Plugin ${pluginName} not found in load order`);
    }
    return plugin.index;
  }
}
