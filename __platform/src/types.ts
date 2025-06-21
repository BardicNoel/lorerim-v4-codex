export interface ParsedRecord {
  meta: {
    isWinner?: boolean; // true if this record is the winner of the stack, false if it is a loser
    type: string; // e.g., 'PERK'
    formId: string; // e.g., '0x00058F80'
    globalFormId: string; // e.g., "0x2C058F80" (0x2C is the load order of the plugin)
    stackOrder?: number | null; // e.g., 0, 1, 2, (0 being the highest version of this record)
    plugin: string; // e.g., 'Requiem.esp'
  };
  record: {
    tag: string;
    buffer: string; // base64 encoded
  }[];
  decodedData?: {
    [key: string]: any; // Decoded data by subrecord ID
  };
  decodedErrors?: {
    [key: string]: any; // Decoded data by subrecord ID
  };
  header: string; // Raw 24-byte record header in base64
}

export interface PluginMeta {
  name: string; // e.g., 'Requiem.esp'
  fullPath: string; // absolute path to plugin binary
  modFolder: string; // which mod the plugin came from
  isEsl: boolean; // true if the plugin is an ESL plugin
  loadOrder: number; // load order index from plugins.txt
  masters?: string[]; // master records in the plugin
  masterIndexMap?: Record<number, string>; // e.g., 0 → "Skyrim.esm", 1 → "Update.esm"
  fileToLoadOrderMap?: Record<string, number>; // reverse of above
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
