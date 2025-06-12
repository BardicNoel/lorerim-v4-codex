// Base stage configuration
export interface BaseStageConfig {
  name: string;
  description?: string;
  type: 'filter-records' | 'remove-fields' | 'keep-fields' | 'sanitize-fields';
  enabled?: boolean;
}

// Filter records stage configuration
export interface FilterRecordsStageConfig extends BaseStageConfig {
  type: 'filter-records';
  criteria: {
    field: string;
    operator: 'equals' | 'not-equals' | 'contains' | 'not-contains' | 'greater-than' | 'less-than';
    value: any;
  }[];
}

// Remove fields stage configuration
export interface RemoveFieldsStageConfig extends BaseStageConfig {
  type: 'remove-fields';
  fields: string[];
  conditions?: {
    field: string;
    operator: 'equals' | 'not-equals' | 'contains' | 'not-contains';
    value: any;
  }[];
}

// Keep fields stage configuration
export interface KeepFieldsStageConfig extends BaseStageConfig {
  type: 'keep-fields';
  fields: string[];
  conditions?: {
    field: string;
    operator: 'equals' | 'not-equals' | 'contains' | 'not-contains';
    value: any;
  }[];
}

// Sanitize fields stage configuration
export interface SanitizeFieldsStageConfig extends BaseStageConfig {
  type: 'sanitize-fields';
  rules: {
    field: string;
    type: 'string' | 'number' | 'boolean' | 'date';
    transform?: 'trim' | 'lowercase' | 'uppercase' | 'parse-int' | 'parse-float' | 'parse-date';
    conditions?: {
      field: string;
      operator: 'equals' | 'not-equals' | 'contains' | 'not-contains';
      value: any;
    }[];
  }[];
}

// Union type for all stage configurations
export type StageConfig = 
  | FilterRecordsStageConfig
  | RemoveFieldsStageConfig
  | KeepFieldsStageConfig
  | SanitizeFieldsStageConfig;

// Pipeline configuration that references stage configs
export interface PipelineConfig {
  name: string;
  description?: string;
  input: string;
  output: string;
  stages: {
    config: string;  // Path to stage config file
    enabled?: boolean;
  }[];
} 