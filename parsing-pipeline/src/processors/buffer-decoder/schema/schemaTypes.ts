import { ParsedRecord } from '@lorerim/platform-types';

export type FieldType =
  | 'string'
  | 'int32'
  | 'uint8'
  | 'uint16'
  | 'uint32'
  | 'float32'
  | 'struct'
  | 'formid'
  | 'array'
  | 'grouped'
  | 'unknown';

export type StringEncoding = 'utf8' | 'utf16le' | 'ascii';

export interface BaseFieldSchema {
  type: FieldType;
  name?: string;
  parser?: (args: any) => any;
}

export interface NoPostParseSchema extends BaseFieldSchema {
  parser?: undefined;
}

export interface StringFieldSchema extends BaseFieldSchema {
  type: 'string';
  encoding: StringEncoding;
}

export interface FormIdFieldSchema extends BaseFieldSchema {
  type: 'formid';
}

export interface NumericFieldSchema extends BaseFieldSchema {
  type: 'uint8' | 'uint16' | 'uint32' | 'float32' | 'int32';
}

export interface StructFieldSchema extends NoPostParseSchema {
  type: 'struct';
  fields: FieldSchema[];
  size?: number;
}

export interface UnknownFieldSchema extends BaseFieldSchema {
  type: 'unknown';
}

export interface ArrayFieldSchema extends NoPostParseSchema {
  type: 'array';
  element: FieldSchema;
}

export interface GroupedFieldsSchema extends NoPostParseSchema {
  type: 'grouped';
  groupSchema: {
    [tag: string]: FieldSchema;
  };
  cardinality: 'single' | 'multiple';
  virtualField: string; // Group will be assigned to this field
  terminatorTag?: string; // if provided, the parser will stop and EXCLUDE this tag
  dynamicSchema?: (parsedData: any) => { [tag: string]: FieldSchema }; // Dynamic schema based on parsed data
}

export type FieldSchema =
  | StringFieldSchema
  | NumericFieldSchema
  | StructFieldSchema
  | FormIdFieldSchema
  | UnknownFieldSchema
  | ArrayFieldSchema
  | GroupedFieldsSchema;

export interface RecordSchema {
  [tag: string]: FieldSchema;
}

export interface SharedFields {
  [name: string]: FieldSchema[];
}

// Define the common fields type
export type CommonFields = {
  EDID: StringFieldSchema;
  FULL: StringFieldSchema;
  DESC: StringFieldSchema;
  ICON: StringFieldSchema;
  DNAM: StringFieldSchema;
  KSIZ: NumericFieldSchema;
  KWDA: ArrayFieldSchema;
  NNAM: FormIdFieldSchema;
};

export interface SchemaInternal {
  [tag: string]: FieldSchema;
}

export interface RecordSpecificSchemas {
  [recordType: string]: CommonFields & SchemaInternal;
}

// Use the platform's ParsedRecord type
export { ParsedRecord };
