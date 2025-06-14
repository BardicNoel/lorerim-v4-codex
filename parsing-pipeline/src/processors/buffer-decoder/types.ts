export type FieldType = 'string' | 'uint8' | 'uint16' | 'uint32' | 'float32' | 'struct';

export type StringEncoding = 'utf8' | 'utf16le' | 'ascii';

export interface BaseFieldSchema {
  type: FieldType;
  name?: string;
}

export interface StringFieldSchema extends BaseFieldSchema {
  type: 'string';
  encoding: StringEncoding;
}

export interface NumericFieldSchema extends BaseFieldSchema {
  type: 'uint8' | 'uint16' | 'uint32' | 'float32';
}

export interface StructFieldSchema extends BaseFieldSchema {
  type: 'struct';
  fields: FieldSchema[];
}

export type FieldSchema = StringFieldSchema | NumericFieldSchema | StructFieldSchema;

export interface RecordSchema {
  [tag: string]: FieldSchema;
}

export interface SharedFields {
  [name: string]: FieldSchema[];
}

export interface RecordSpecificSchemas {
  [recordType: string]: {
    [tag: string]: FieldSchema;
  };
}

export interface ParsedRecord {
  [tag: string]: any;
} 