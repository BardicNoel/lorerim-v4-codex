import { ParsedRecord } from "@lorerim/platform-types";

export interface PluginMeta {
  name: string; // e.g., 'Requiem.esp'
  fullPath: string; // absolute path to plugin binary
  modFolder: string; // which mod the plugin came from
  index: number; // load order index from plugins.txt
}

export interface RecordHeader {
  type: string;
  dataSize: number;
  flags: number;
  formId: number;
  version: number;
  unknown: number;
}

export interface SubrecordHeader {
  type: string;
  size: number;
}

export interface Subrecord {
  type: string;
  size: number;
  data: Buffer;
}

interface Config {
  modDirPath: string; // Path to directory containing modlist.txt and plugins.txt
  outputPath: string;
  maxThreads: number;
}

// Re-export ParsedRecord from platform types
