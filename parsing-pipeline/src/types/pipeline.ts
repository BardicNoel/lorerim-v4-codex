import { ParsedRecord } from '@lorerim/platform-types';

// JSON types
export type JsonValue = string | number | boolean | null | JsonObject | JsonArray;
export interface JsonObject {
  [key: string]: JsonValue;
}
export type JsonArray = ParsedRecord[]; // Use platform's record format
export type JsonRecord = ParsedRecord; // Use extractor's record format as our standard

// Stage types
export type StageType =
  | 'filter-records'
  | 'remove-fields'
  | 'keep-fields'
  | 'sanitize-fields'
  | 'buffer-decoder'
  | 'flatten-fields'
  | 'merge-records'
  | 'rename-fields'
  | 'sample-records';

// Field path type for nested fields (e.g., "user.profile.status")
export type FieldPath = string;

// Base stage configuration
export interface BaseStageConfig {
  name: string;
  description?: string;
  type: StageType;
  enabled?: boolean;
}

// Filter records stage configuration
export interface FilterRecordsConfig extends BaseStageConfig {
  type: 'filter-records';
  criteria: {
    field: FieldPath;
    operator:
      | 'equals'
      | 'not-equals'
      | 'contains'
      | 'not-contains'
      | 'greater-than'
      | 'less-than'
      | 'in-list'
      | 'not-in-list';
    value: any;
  }[];
}

// Remove fields stage configuration
export interface RemoveFieldsConfig extends BaseStageConfig {
  type: 'remove-fields';
  fields:
    | FieldPath[]
    | {
        [key: string]:
          | string[]
          | string
          | { [key: string]: string[] | string | { [key: string]: string[] | string } };
      };
  value?: string; // Optional value to match against field contents
  conditions?: {
    field: FieldPath;
    operator: 'equals' | 'not-equals' | 'contains' | 'not-contains';
    value: any;
  }[];
}

// Keep fields stage configuration
export interface KeepFieldsConfig extends BaseStageConfig {
  type: 'keep-fields';
  fields: FieldPath[];
  conditions?: {
    field: FieldPath;
    operator: 'equals' | 'not-equals' | 'contains' | 'not-contains';
    value: any;
  }[];
}

// Sanitize fields stage configuration
export interface SanitizeFieldsConfig extends BaseStageConfig {
  type: 'sanitize-fields';
  rules: {
    pattern: string; // Pattern to match in field values
    action: 'remove' | 'replace' | 'extractFormId'; // What to do with matching fields
    replacement?: string; // Value to replace with (if action is 'replace')
    excludeFields?: FieldPath[]; // Fields to exclude from checking
  }[];
}

// Buffer decoder stage configuration
export interface BufferDecoderConfig extends BaseStageConfig {
  type: 'buffer-decoder';
  recordType: string; // The type of record being decoded (e.g., "PERK", "SPEL")
  loadPluginMetadata?: boolean; // Whether to load plugin metadata for FormID resolution
  pluginMetadataPath?: string; // Optional path to plugin-metadata.json (defaults to parentDir/plugin-metadata.json)
  inputFilePath?: string; // Path to the input file for auto-discovery of plugin metadata
  multithreaded?: boolean; // Whether to use multithreaded processing (defaults to false)
  maxWorkers?: number; // Maximum number of worker threads (defaults to CPU cores, capped at 8)
}

// Flatten fields stage configuration
export interface FlattenFieldsConfig extends BaseStageConfig {
  type: 'flatten-fields';
  fields: string[];
}

// Merge records stage configuration
export interface MergeRecordsConfig extends BaseStageConfig {
  type: 'merge-records';
  sourceFile: string; // Path to the source records file
  sourceRecordType: string; // Type of source records (e.g., 'PERK')
  mappings: {
    sourceField: string; // Field path in source records (e.g., 'decodedData.perkSections[].PNAM')
    targetField: string; // Field path in target records (e.g., 'meta.formId')
    matchType: 'exact' | 'contains' | 'array-contains'; // How to match values
    matchField?: string; // Field to match on in source records (defaults to sourceField if not specified)
    dataField?: string; // Field to pull data from in source records (defaults to entire record if not specified)
  }[];
  mergeField: string; // Field to store merged data in target records (e.g., 'mergedData')
  mergeStrategy: 'first' | 'all' | 'count'; // How to handle multiple matches
  overwriteReference?: boolean; // If true, replace original field values with referenced records
  siblingField?: string; // If specified, create a sibling field with this name instead of overwriting
}

// Rename fields stage configuration
export interface RenameFieldsConfig extends BaseStageConfig {
  type: 'rename-fields';
  mappings: {
    [oldFieldPath: string]: string; // old path -> new field name
  };
}

// Sample records stage configuration
export interface SampleRecordsConfig extends BaseStageConfig {
  type: 'sample-records';
  sampleSize: number; // Number of records to sample
  method?: 'random' | 'first' | 'last'; // Sampling method, defaults to 'random'
  seed?: number; // Random seed for reproducible sampling
}

// Stage configuration union type
export type StageConfig =
  | FilterRecordsConfig
  | RemoveFieldsConfig
  | KeepFieldsConfig
  | SanitizeFieldsConfig
  | BufferDecoderConfig
  | FlattenFieldsConfig
  | MergeRecordsConfig
  | RenameFieldsConfig
  | SampleRecordsConfig;

// Pipeline configuration
export interface PipelineConfig {
  name: string;
  description?: string;
  input: string;
  output: string;
  stages: StageConfig[];
}

// Processing result type
export interface ProcessingResult {
  [key: string]: number;
}
