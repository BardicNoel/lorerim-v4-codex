import { ParsedRecord } from '@lorerim/platform-types';

export type FieldType = 'string' | 'uint8' | 'uint16' | 'uint32' | 'float32' | 'struct' | 'formid' | 'array' | 'unknown';


export type StringEncoding = 'utf8' | 'utf16le' | 'ascii' ;

export interface BaseFieldSchema {
  type: FieldType;
  name?: string;
}

export interface StringFieldSchema extends BaseFieldSchema {
  type: 'string';
  encoding: StringEncoding;
}

export interface FormIdFieldSchema extends BaseFieldSchema {
  type: 'formid';
}

export interface NumericFieldSchema extends BaseFieldSchema {
  type: 'uint8' | 'uint16' | 'uint32' | 'float32';
}

export interface StructFieldSchema extends BaseFieldSchema {
  type: 'struct';
  fields: FieldSchema[];
}

export interface UnknownFieldSchema extends BaseFieldSchema {
  type: 'unknown';
}

export interface ArrayFieldSchema extends BaseFieldSchema {
  type: 'array';
  element: FieldSchema;
}

export type FieldSchema = StringFieldSchema | NumericFieldSchema | StructFieldSchema | FormIdFieldSchema | UnknownFieldSchema | ArrayFieldSchema  ;

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

// Use the platform's ParsedRecord type
export { ParsedRecord }; 