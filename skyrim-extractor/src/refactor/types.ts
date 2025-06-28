import { ParsedRecord } from "@lorerim/platform-types";
import { ProcessingStats } from "../utils/statsCollector";

export interface BufferMeta {
  tag: string; // Record tag or 'GRUP'
  offset: number; // Byte offset in the file
  endOffset: number; // End of the record
  size: number; // Total size of the record or GRUP
  formId?: number; // For non-GRUP records
  groupType?: number; // For GRUPs
  label?: number; // For GRUPs (e.g., 0x4B455250 for 'PERK')
  parentPath: string[]; // Nested GRUP hierarchy
  sourcePlugin: string; // e.g., 'Requiem.esp'
  modFolder: string; // e.g., 'Requiem'
  pluginIndex: number; // e.g., 20
}

export interface WorkerMessage {
  log?: boolean;
  level?: "info" | "debug";
  message?: string;
  error?: string;
  bufferMetas?: BufferMeta[];
  parsedRecords?: ParsedRecord[];
  stats?: ProcessingStats;
  plugin?: string;
}

export interface ThreadPoolConfig {
  maxThreads: number;
  debug?: boolean;
  recordTypeFilter?: string[];
}
