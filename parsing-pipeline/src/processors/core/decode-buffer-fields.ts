import { JsonArray, JsonRecord, DecodeBufferFieldsConfig } from '../../types/pipeline';
import { Processor } from './index';
import { Buffer } from 'buffer';
import { COMMON_FIELD_TYPES, createRecordTypeConfig } from './common-field-types';

export type FieldTypeConfig = {
  type: 'string' | 'number' | 'boolean' | 'formId' | 'bytes';
  encoding?: BufferEncoding;
  offset?: number;
  length?: number;
  isArray?: boolean;
  lengthPrefixed?: boolean;
};

function decodeBuffer(buffer: Buffer, config: FieldTypeConfig): any {
  if (!buffer || !Buffer.isBuffer(buffer)) {
    return null;
  }

  const { type, encoding = 'utf8', offset = 0, length } = config;

  switch (type) {
    case 'string': {
      let str: string;
      if (config.lengthPrefixed) {
        const len = buffer[offset];
        str = buffer.toString(encoding, offset + 1, offset + 1 + len);
      } else {
        str = buffer.toString(encoding, offset, length);
        // If the string contains a null byte, strip everything up to and including it
        const nullIdx = str.indexOf('\0');
        if (nullIdx !== -1) {
          str = str.slice(nullIdx + 1);
        }
        // Also strip any leading field name and dot (e.g., 'EDID.')
        str = str.replace(/^[A-Z0-9_]+\./, '');
        // For CTDA fields, strip any trailing CTDA marker
        if (str.endsWith('CTDA')) {
          str = str.slice(0, -4);
        }
      }
      // Trim any trailing nulls or whitespace
      return str.replace(/\0.*$/, '').trim();
    }
    case 'number':
      return buffer.readUInt32LE(offset);
    case 'boolean':
      return buffer.readUInt8(offset) !== 0;
    case 'formId':
      // Convert formId to hex string with plugin index
      const formId = buffer.readUInt32LE(offset);
      const pluginIndex = (formId >> 24) & 0xFF;
      const localId = formId & 0x00FFFFFF;
      return `${pluginIndex.toString(16).padStart(2, '0')}${localId.toString(16).padStart(6, '0')}`;
    case 'bytes':
      // Return the buffer as an array of bytes (or hex string if needed)
      return buffer.slice(offset, length ? offset + length : undefined);
    default:
      return null;
  }
}

function processBufferField(value: any, fieldName: string, config: Record<string, FieldTypeConfig> | undefined): any {
  if (!Array.isArray(value)) {
    return value;
  }

  // Check if this field has a specific type configuration
  const fieldConfig = config && fieldName in config ? config[fieldName] : undefined;
  if (!fieldConfig) {
    return value;
  }

  // If the field is empty, return appropriate empty value
  if (value.length === 0) {
    return fieldConfig.isArray ? [] : '';
  }

  // Process each buffer in the array
  const decodedValues = value.map(item => {
    if (item?.type === 'Buffer' && Array.isArray(item.data)) {
      const buffer = Buffer.from(item.data);
      // For array fields, if the buffer is empty, return null to be filtered out
      if (fieldConfig.isArray && buffer.length === 0) {
        return null;
      }
      return decodeBuffer(buffer, fieldConfig);
    }
    return item;
  }).filter(val => val !== null); // Filter out null values for array fields

  // Return single value for non-array fields
  return fieldConfig.isArray ? decodedValues : decodedValues[0];
}

export function createDecodeBufferFieldsProcessor(config: DecodeBufferFieldsConfig): Processor {
  let stats = {
    recordsProcessed: 0,
    fieldsDecoded: 0
  };

  return {
    async transform(data: JsonArray): Promise<JsonArray> {
      stats.recordsProcessed = data.length;
      stats.fieldsDecoded = 0;

      return data.map((record: JsonRecord) => {
        const newRecord: JsonRecord = { ...record };

        // Process data field if it exists
        if (record.data && typeof record.data === 'object') {
          const dataObj = record.data as Record<string, any>;
          newRecord.data = { ...dataObj };
          
          // Process each field in data
          for (const [fieldName, value] of Object.entries(dataObj)) {
            const decodedValue = processBufferField(value, fieldName, config.fieldTypes);
            if (decodedValue !== value) {
              (newRecord.data as Record<string, any>)[fieldName] = decodedValue;
              stats.fieldsDecoded++;
            }
          }
        }

        return newRecord;
      });
    },

    getStats: () => stats
  };
}

// Configuration for decoding MGEF record buffer fields
export const MGEF_DECODE_CONFIG: DecodeBufferFieldsConfig = {
  type: 'decode-buffer-fields',
  name: 'MGEF Buffer Decoder',
  fieldTypes: createRecordTypeConfig('MGEF', {
    EDID: { ...COMMON_FIELD_TYPES.EDID_FIELD, isArray: false },
    FULL: { ...COMMON_FIELD_TYPES.FULL_FIELD, isArray: false, length: 6 },
    MDOB: { ...COMMON_FIELD_TYPES.FORMID_FIELD, isArray: false },
    KWDA: { ...COMMON_FIELD_TYPES.FORMID_ARRAY_FIELD, isArray: true },
    DATA: {
      type: 'bytes',
      length: 152, // struct[152]
      isArray: false
    },
    ESCE: { ...COMMON_FIELD_TYPES.FORMID_FIELD, isArray: false },
    SNDD: { ...COMMON_FIELD_TYPES.SOUND_DATA_FIELD, isArray: true },
    DNAM: { ...COMMON_FIELD_TYPES.FULL_FIELD, isArray: false },
    CTDA: { ...COMMON_FIELD_TYPES.CTDA_FIELD, isArray: true }
  })
}; 