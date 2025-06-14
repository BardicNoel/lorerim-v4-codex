import { ParsedRecord, PluginMeta } from '../types';
import { AggregatorConfig, AggregationResult } from './types';

export class RecordAggregator {
  private plugins: PluginMeta[];
  private recordMap: Map<string, ParsedRecord[]>;
  private allRecords: ParsedRecord[];

  constructor(config: AggregatorConfig) {
    this.plugins = config.plugins;
    this.recordMap = new Map();
    this.allRecords = [];
  }

  /**
   * Process a batch of records from a plugin
   * @param pluginIndex The index of the plugin in the load order
   * @param records The records to process
   */
  public processPluginRecords(pluginIndex: number, records: ParsedRecord[]): void {
    for (const record of records) {
      const formId = record.meta.formId;
      
      // Initialize array for this FormID if we haven't seen it before
      if (!this.recordMap.has(formId)) {
        this.recordMap.set(formId, []);
      }

      // Get the current stack for this FormID
      const stack = this.recordMap.get(formId)!;
      
      // Set the stack order (0 being the highest version)
      record.meta.stackOrder = stack.length;
      
      // Add to both the stack and all records
      stack.push(record);
      this.allRecords.push(record);
    }
  }

  /**
   * Get the final aggregation result
   */
  public getResult(): AggregationResult {
    return {
      records: this.allRecords,
      recordStacks: this.recordMap
    };
  }

  /**
   * Get the plugin index for a given plugin name
   */
  private getPluginIndex(pluginName: string): number {
    const plugin = this.plugins.find(p => p.name === pluginName);
    if (!plugin) {
      throw new Error(`Plugin ${pluginName} not found in load order`);
    }
    return plugin.index;
  }
} 