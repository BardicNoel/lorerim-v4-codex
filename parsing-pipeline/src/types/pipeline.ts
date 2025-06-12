// JSON types
export type JsonValue = string | number | boolean | null | JsonObject | JsonArray;
export interface JsonObject { [key: string]: JsonValue; }
export type JsonArray = JsonObject[];
export type JsonRecord = JsonObject;

// Stage types
export type StageType = 
  | 'filter-records'
  | 'remove-fields'
  | 'keep-fields'
  | 'sanitize-fields';

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
    operator: 'equals' | 'not-equals' | 'contains' | 'not-contains' | 'greater-than' | 'less-than';
    value: any;
  }[];
}

// Remove fields stage configuration
export interface RemoveFieldsConfig extends BaseStageConfig {
  type: 'remove-fields';
  fields: FieldPath[];
  value?: string;  // Optional value to match against field contents
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
    pattern: string;  // Pattern to match in field values
    action: 'remove' | 'replace';  // What to do with matching fields
    replacement?: string;  // Value to replace with (if action is 'replace')
    excludeFields?: FieldPath[];  // Fields to exclude from checking
  }[];
}

// Stage configuration union type
export type StageConfig = 
  | FilterRecordsConfig
  | RemoveFieldsConfig
  | KeepFieldsConfig
  | SanitizeFieldsConfig;

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