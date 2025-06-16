import { PluginMeta } from "../types";
import { ParsedRecord } from "@lorerim/platform-types";

export interface RecordMeta {
  recordType: string;
  formID: number;
  pluginIndex: number;
  sourcePlugin: string;
  fileOffset: number;
  dataSize: number;
  isWinner: boolean;
}

export interface AggregationResult {
  records: ParsedRecord[];
  recordStacks: Map<string, ParsedRecord[]>; // FormID -> array of records in stack order
}

export interface AggregatorConfig {
  plugins: PluginMeta[];
}
