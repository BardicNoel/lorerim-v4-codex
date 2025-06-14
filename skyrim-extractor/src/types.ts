export interface PluginMeta {
  name: string;        // e.g., 'Requiem.esp'
  fullPath: string;    // absolute path to plugin binary
  modFolder: string;   // which mod the plugin came from
  index: number;       // load order index from plugins.txt
}

export interface ParsedRecord {
  meta: {
    type: string;   // e.g., 'PERK'
    formId: string; // e.g., '00058F80'
    plugin: string; // e.g., 'Requiem.esp'
  };
  data: Record<string, Buffer[]>; // Subrecord content by subrecord ID
  header: string; // Raw 20-byte record header in base64
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

// Record-specific interfaces
export interface RawAVIF {
  EDID: string;
  FULL: string;
  DESC?: string;
  AVSK?: {
    useMult: number;
    improveMult: number;
    offsetMult: number;
    improveOffset: number;
  };
}

export interface RawPERK {
  EDID: string;
  FULL: string;
  DESC?: string;
  DATA: {
    type: number;
    level: number;
    numSubRanks: number;
  };
  PRKE: RawPerkEffect[];
  CNAM?: RawPerkCondition[];
}

export interface RawPerkEffect {
  entryPoint: number;
  functionType: number;
  perkConditionTabIndex: number;
  EPFD: string; // function parameters or FormID
}

export interface RawPerkCondition {
  CTDA: {
    op: number;
    compValue: number;
    func: number;
    param1: number;
    param2: number;
    runOn: number;
    reference?: string;
  };
}

export interface RawRACE {
  EDID: string;
  FULL: string;
  DESC?: string;
  DATA: {
    flags: number;
    maleHeight: number;
    femaleHeight: number;
    maleWeight: number;
    femaleWeight: number;
    baseMass: number;
  };
  SPLO?: string[];
  AVSK?: SkillBonus[];
}

export interface SkillBonus {
  skillID: number;
  bonus: number;
}

export interface RawSPEL {
  EDID: string;
  FULL: string;
  SPIT: {
    type: number;
    cost: number;
    flags: number;
  };
  EFID: string[];
}

export interface RawMGEF {
  EDID: string;
  FULL: string;
  DATA: {
    archetype: number;
    baseCost: number;
    flags: number;
    associatedAV: number;
  };
}

export interface Config {
  modDirPath: string;  // Path to directory containing modlist.txt and plugins.txt
  outputPath: string;
  maxThreads: number;
} 