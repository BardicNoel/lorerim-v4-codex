export interface Schema {
  fields: Field[];
  totalRecords: number;
  sampleData: any[];
}

export interface Field {
  name: string;
  type: FieldType;
  nullable: boolean;
  uniqueValues: number;
  sampleValues: any[];
  description?: string;
}

export type FieldType = 
  | 'string' 
  | 'number' 
  | 'boolean' 
  | 'object' 
  | 'array' 
  | 'null' 
  | 'mixed';

export interface SchemaAnalysis {
  schema: Schema;
  validationResults: ValidationResult[];
  statistics: FieldStatistics[];
}

export interface ValidationResult {
  field: string;
  type: 'error' | 'warning' | 'info';
  message: string;
  count: number;
}

export interface FieldStatistics {
  field: string;
  nullCount: number;
  uniqueCount: number;
  minValue?: any;
  maxValue?: any;
  averageValue?: number;
} 