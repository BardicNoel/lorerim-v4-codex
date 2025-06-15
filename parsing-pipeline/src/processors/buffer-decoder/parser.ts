import { Buffer } from 'buffer';
import { FieldSchema, ParsedRecord, StringEncoding } from './types';
import { commonFieldSchemas, recordSpecificSchemas } from './schemas';
import { JsonArray, BufferDecoderConfig, JsonRecord } from '../../types/pipeline';
import { Processor } from '../core';
import { formatJSON } from '@lorerim/platform-types';
import { parentPort } from 'worker_threads';
import { writeFileSync } from 'fs';
import { join } from 'path';

// Debug logging function that works in both worker and main thread
function debugLog(message: string, data?: any) {
  console.log(`[DEBUG] ${message}`, data);
  if (parentPort) {
    parentPort.postMessage({ type: 'debug', message, data });
  }
}

// Error logging function that works in both worker and main thread
function errorLog(message: string, error?: any) {
  console.error(`[ERROR] ${message}`, error);
  if (parentPort) {
    parentPort.postMessage({ type: 'error', message, error: error?.message || error });
  }
}

export class BufferDecoder {
  public getFieldSchema(recordType: string, tag: string): FieldSchema | undefined {
    return recordSpecificSchemas[recordType]?.[tag] || commonFieldSchemas[tag];
  }

  public parseString(
    buffer: Buffer,

    encoding: StringEncoding
  ): string {
    return buffer.toString(encoding).replace(/\0+$/, '');
  }

  public parseFormId(buffer: Buffer, offset: number): string {
    const value = buffer.readUInt32LE(offset);
    return `0x${value.toString(16).padStart(8, '0')}`;
  }

  public parseNumeric(buffer: Buffer, offset: number, type: string): number {
    switch (type) {
      case 'uint8':
        return buffer.readUInt8(offset);
      case 'uint16':
        return buffer.readUInt16LE(offset);
      case 'uint32':
        return buffer.readUInt32LE(offset);
      case 'float32':
        return buffer.readFloatLE(offset);
      default:
        throw new Error(`Unsupported numeric type: ${type}`);
    }
  }

  public parseStruct(
    buffer: Buffer,
    offset: number,
    length: number,
    fields: FieldSchema[],
    useFieldLength = true
  ): any {
    const result: any = {};
    let currentOffset = offset;
    const endOffset = offset + length;

    console.log(
      `[DEBUG] Starting struct parse at offset ${offset}, length ${length}, endOffset ${endOffset}`
    );
    console.log(`[DEBUG] Buffer length: ${buffer.length}, Fields to parse: ${fields.length}`);

    for (const field of fields) {
      if (!field.name) throw new Error('Struct field must have a name');

      console.log(
        `[DEBUG] Processing field "${field.name}" (${field.type}) at offset ${currentOffset}`
      );
      console.log(`[DEBUG] Remaining buffer: ${endOffset - currentOffset} bytes`);

      switch (field.type) {
        case 'string':
          if (!('encoding' in field)) throw new Error('String field must specify encoding');
          let strLength: number;
          if (useFieldLength) {
            strLength = length;
            result[field.name] = this.parseString(buffer, field.encoding);
            currentOffset += strLength;
          } else {
            strLength = buffer.readUInt16LE(currentOffset);
            console.log(`[DEBUG] String length from buffer: ${strLength}`);
            result[field.name] = this.parseString(buffer, field.encoding);
            currentOffset += 2 + strLength;
          }
          console.log(`[DEBUG] After string: new offset ${currentOffset}`);
          break;

        case 'formid':
          result[field.name] = this.parseFormId(buffer, currentOffset);
          currentOffset += 4;
          console.log(`[DEBUG] After formid: new offset ${currentOffset}`);
          break;

        case 'uint8':
        case 'uint16':
        case 'uint32':
        case 'float32':
          result[field.name] = this.parseNumeric(buffer, currentOffset, field.type);
          currentOffset += this.getTypeSize(field.type);
          console.log(`[DEBUG] After ${field.type}: new offset ${currentOffset}`);
          break;

        case 'struct':
          if (!('fields' in field)) throw new Error('Struct field must specify fields');
          const structLength = buffer.readUInt16LE(currentOffset);
          console.log(`[DEBUG] Nested struct length: ${structLength}`);
          result[field.name] = this.parseStruct(
            buffer,
            currentOffset + 2,
            structLength,
            field.fields,
            false
          );
          currentOffset += 2 + structLength;
          console.log(`[DEBUG] After nested struct: new offset ${currentOffset}`);
          break;

        case 'array':
          if (!('element' in field)) throw new Error('Array field must specify element');
          const arrayLength = buffer.readUInt16LE(currentOffset);
          console.log(`[DEBUG] Array length: ${arrayLength}`);
          result[field.name] = this.parseArray(
            buffer,
            currentOffset + 2,
            arrayLength,
            field.element
          );
          currentOffset += 2 + arrayLength;
          console.log(`[DEBUG] After array: new offset ${currentOffset}`);
          break;

        case 'unknown':
          const unknownLength = buffer.readUInt16LE(currentOffset);
          console.log(`[DEBUG] Unknown field length: ${unknownLength}`);
          currentOffset += 2 + unknownLength;
          console.log(`[DEBUG] After unknown: new offset ${currentOffset}`);
          break;
      }

      if (currentOffset > endOffset) {
        console.error(`[ERROR] Buffer overrun detected for field "${field.name}"`);
        console.error(`[ERROR] Current offset: ${currentOffset}, End offset: ${endOffset}`);
        console.error(`[ERROR] Overrun by: ${currentOffset - endOffset} bytes`);
        console.error(`[ERROR] Field type: ${field.type}`);
        console.error(`[ERROR] Buffer length: ${buffer.length}`);
        throw new Error(`Struct parsing overran bounds for ${field.name}`);
      }
    }

    return result;
  }

  public parseArray(
    buffer: Buffer,
    offset: number,
    length: number,
    elementSchema: FieldSchema
  ): any[] {
    const results: any[] = [];
    let currentOffset = offset;
    const endOffset = offset + length;

    console.log(
      `[DEBUG] Starting array parse at offset ${offset}, length ${length}, endOffset ${endOffset}`
    );
    console.log(`[DEBUG] Array element type: ${elementSchema.type}`);

    while (currentOffset < endOffset) {
      console.log(`[DEBUG] Processing array element at offset ${currentOffset}`);
      console.log(`[DEBUG] Remaining array bytes: ${endOffset - currentOffset}`);

      switch (elementSchema.type) {
        case 'string':
          if (!('encoding' in elementSchema))
            throw new Error('String element must specify encoding');
          const strLength = buffer.readUInt16LE(currentOffset);
          console.log(`[DEBUG] String element length: ${strLength}`);
          results.push(
            this.parseString(
              buffer.slice(currentOffset + 2, currentOffset + 2 + strLength),
              elementSchema.encoding
            )
          );
          currentOffset += 2 + strLength;
          break;

        case 'struct':
          if (!('fields' in elementSchema)) throw new Error('Struct element must specify fields');
          const structLength = buffer.readUInt16LE(currentOffset);
          console.log(`[DEBUG] Struct element length: ${structLength}`);
          const structData = this.parseStruct(
            buffer,
            currentOffset + 2,
            structLength,
            elementSchema.fields
          );
          results.push(structData);
          currentOffset += 2 + structLength;
          break;

        case 'formid':
          results.push(this.parseFormId(buffer, currentOffset));
          currentOffset += 4;
          break;

        case 'uint8':
        case 'uint16':
        case 'uint32':
        case 'float32':
          results.push(this.parseNumeric(buffer, currentOffset, elementSchema.type));
          currentOffset += this.getTypeSize(elementSchema.type);
          break;

        default:
          throw new Error(`Unsupported array element type: ${elementSchema.type}`);
      }

      console.log(`[DEBUG] After array element: new offset ${currentOffset}`);

      if (currentOffset > endOffset) {
        console.error(`[ERROR] Array parsing overran bounds`);
        console.error(`[ERROR] Current offset: ${currentOffset}, End offset: ${endOffset}`);
        console.error(`[ERROR] Overrun by: ${currentOffset - endOffset} bytes`);
        console.error(`[ERROR] Element type: ${elementSchema.type}`);
        throw new Error('Array parsing overran bounds');
      }
    }

    return results;
  }

  private getTypeSize(type: string): number {
    switch (type) {
      case 'uint8':
        return 1;
      case 'uint16':
        return 2;
      case 'uint32':
      case 'float32':
      case 'formid':
        return 4;
      default:
        throw new Error(`Unsupported type size: ${type}`);
    }
  }

  private logSchemaResolution(recordType: string, tag: string, schema: FieldSchema | undefined) {
    debugLog(`Field ${tag} in ${recordType}:`, {
      recordType,
      hasSchema: !!schema,
      schemaType: schema?.type,
      schemaSource: schema
        ? recordSpecificSchemas[recordType]?.[tag]
          ? 'recordSpecific'
          : 'common'
        : 'none',
    });
  }

  public parseRecord(recordType: string, buffer: Buffer): Record<string, any> {
    const result: Record<string, any> = {};
    let offset = 0;
    let fieldCount = 0;

    // Safety check - need at least 6 bytes for a field header (4 for tag, 2 for length)
    if (buffer.length < 6) {
      errorLog(`Buffer too small for field header:`, {
        bufferLength: buffer.length,
        hex: buffer.toString('hex'),
        recordType,
      });
      return result;
    }

    // Log available schemas for this record type
    debugLog(`Record type ${recordType} schemas:`, {
      recordSpecific: recordSpecificSchemas[recordType]
        ? Object.keys(recordSpecificSchemas[recordType])
        : [],
      common: Object.keys(commonFieldSchemas),
    });

    while (offset < buffer.length) {
      try {
        // Ensure we have enough bytes remaining for a field header
        if (buffer.length - offset < 6) {
          errorLog(`Not enough bytes remaining for field header:`, {
            offset,
            bufferLength: buffer.length,
            remainingBytes: buffer.length - offset,
            hex: buffer.slice(offset).toString('hex'),
            recordType,
            parsedFields: Object.keys(result),
          });
          return result;
        }

        const tag = buffer.toString('ascii', offset, offset + 4);
        const length = buffer.readUInt16LE(offset + 4);

        debugLog(`Processing field ${tag}:`, {
          offset,
          length,
          bufferLength: buffer.length,
          remainingBytes: buffer.length - offset,
          hex: buffer.slice(offset, offset + 6).toString('hex'),
        });

        const schema = this.getFieldSchema(recordType, tag);

        this.logSchemaResolution(recordType, tag, schema);

        if (schema) {
          switch (schema.type) {
            case 'string':
              if (!('encoding' in schema)) throw new Error('String field must specify encoding');
              result[tag] = this.parseString(buffer, schema.encoding);
              break;

            case 'formid':
              result[tag] = this.parseFormId(buffer, offset);
              break;

            case 'uint8':
            case 'uint16':
            case 'uint32':
            case 'float32':
              result[tag] = this.parseNumeric(buffer, offset, schema.type);
              break;

            case 'struct':
              if (!('fields' in schema)) throw new Error('Struct field must specify fields');
              result[tag] = this.parseStruct(buffer, offset, length, schema.fields);
              break;

            case 'array':
              if (!('element' in schema)) throw new Error('Array field must specify element');
              result[tag] = this.parseArray(buffer, offset, length, schema.element);
              break;

            case 'unknown':
              break;
          }
          fieldCount++;
        }

        offset += length;
      } catch (error) {
        errorLog(`Failed to decode field at offset ${offset}:`, error);
        errorLog(`Buffer context:`, {
          offset,
          bufferLength: buffer.length,
          remainingBytes: buffer.length - offset,
          hex: buffer.slice(offset, Math.min(offset, buffer.length)).toString('hex'),
          recordType,
          parsedFields: Object.keys(result),
        });
        // Return what we've parsed so far instead of throwing
        return result;
      }
    }

    return result;
  }
}

function createBufferFromFieldData(fieldData: any[]): Buffer | null {
  if (fieldData.length === 0) {
    console.log(`[DEBUG] No buffer Opt 1`);
    return null;
  }

  const firstItem = fieldData[0];

  if (Buffer.isBuffer(firstItem)) {
    return firstItem;
  }

  // Handle base64 string
  if (typeof firstItem === 'string') {
    try {
      return Buffer.from(firstItem, 'base64');
    } catch (error) {
      console.log(`[DEBUG] Failed to decode base64 string:`, error);
      return null;
    }
  }

  // Handle object with numeric keys containing byte values
  if (typeof firstItem === 'object' && firstItem !== null) {
    // Check if it's a serialized buffer object
    if (
      'type' in firstItem &&
      firstItem.type === 'Buffer' &&
      'data' in firstItem &&
      Array.isArray(firstItem.data)
    ) {
      return Buffer.from(firstItem.data as number[]);
    }

    // Check if it's an object with numeric keys containing byte values
    const keys = Object.keys(firstItem);
    if (keys.length > 0 && keys.every((key) => !isNaN(Number(key)))) {
      const bytes = keys.map((key) => firstItem[key]);
      return Buffer.from(bytes);
    }
  }

  return null;
}

interface ProcessRecordResult {
  processedRecord: ParsedRecord;
  hasDecodedFields: boolean;
  recordErrors: number;
}

function processRecordFields(
  record: ParsedRecord,
  config: BufferDecoderConfig,
  decoder: BufferDecoder
): ProcessRecordResult {
  const processedRecord = { ...record } as ParsedRecord;
  let hasDecodedFields = false;
  let recordErrors = 0;

  for (const [fieldName, fieldData] of Object.entries(processedRecord.data)) {
    if (!Array.isArray(fieldData) || fieldData.length === 0) continue;

    const buffer = createBufferFromFieldData(fieldData);
    if (!buffer) {
      console.log(`[DEBUG] No buffer found for ${fieldName} in ${config.recordType}`);
      continue;
    }

    try {
      // console.log(
      //   `[DEBUG] About to parse record for ${fieldName} in ${config.recordType}, buffer length: ${buffer.length}`
      // );

      // Get the schema for this field
      const schema = decoder.getFieldSchema(config.recordType, fieldName);

      if (!schema) {
        // console.log(`[DEBUG] No schema found for ${fieldName} in ${config.recordType}`);
        continue;
      }

      let decodedField;

      switch (schema.type) {
        case 'string':
          if (!('encoding' in schema)) throw new Error('String field must specify encoding');
          decodedField = decoder.parseString(buffer, schema.encoding);

          if (fieldName === 'FULL') {
            console.log(`[DEBUG] FULL string:`, decodedField);
            console.log(`[DEBUG] FULL buffer:`, buffer.toString('hex'));
          }

          break;

        case 'formid':
          decodedField = decoder.parseFormId(buffer, 0);
          break;

        case 'uint8':
        case 'uint16':
        case 'uint32':
        case 'float32':
          decodedField = decoder.parseNumeric(buffer, 0, schema.type);
          break;

        case 'struct':
          decodedField = decoder.parseStruct(buffer, 0, buffer.readUInt16LE(4), schema.fields);
          break;

        case 'array':
          decodedField = decoder.parseArray(buffer, 0, buffer.readUInt16LE(4), schema.element);
          break;

        default:
          decodedField = null;
      }

      console.log(`[DEBUG] Successfully parsed record for ${fieldName}`);

      if (!processedRecord.decodedData) {
        processedRecord.decodedData = {};
      }
      processedRecord.decodedData![fieldName] = decodedField;
      hasDecodedFields = true;
    } catch (error) {
      console.error(`[ERROR] Failed to parse record for ${fieldName}:`, error);
      errorLog(`Failed to decode field ${fieldName}:`, error);
      if (!processedRecord.decodedErrors) {
        processedRecord.decodedErrors = {};
      }
      processedRecord.decodedErrors[fieldName] = {
        error: error instanceof Error ? error.message : String(error),
        fieldPath: `data.${fieldName}`,
        details: {
          bufferLength: buffer.length,
          hex: buffer.toString('hex'),
          recordType: config.recordType,
        },
      };
      recordErrors++;
    }
  }

  return { processedRecord, hasDecodedFields, recordErrors };
}

export function createBufferDecoderProcessor(config: BufferDecoderConfig): Processor {
  const decoder = new BufferDecoder();
  let stats = {
    recordsProcessed: 0,
    recordsDecoded: 0,
    errors: 0,
    totalFields: 0,
    skippedFields: 0,
  };

  return {
    transform(records: JsonArray): Promise<JsonArray> {
      // Write first few records to file for inspection
      const debugRecords = records.slice(0, 5).map((record) => ({
        meta: record.meta,
        data: Object.entries(record.data).reduce((acc, [key, value]) => {
          acc[key] = {
            isArray: Array.isArray(value),
            length: Array.isArray(value) ? value.length : 0,
            firstItem:
              Array.isArray(value) && value.length > 0
                ? {
                    type: typeof value[0],
                    value: value[0],
                    isBuffer: Buffer.isBuffer(value[0]),
                    keys: typeof value[0] === 'object' ? Object.keys(value[0]) : null,
                    stringified: JSON.stringify(value[0], null, 2),
                  }
                : null,
          };
          return acc;
        }, {} as Record<string, any>),
      }));

      const debugOutput = {
        totalRecords: records.length,
        sampleRecords: debugRecords,
        config,
      };

      writeFileSync(join(process.cwd(), 'buffer-debug-output.json'), formatJSON(debugOutput));

      const startTime = Date.now();
      const totalRecords = records.length;
      const logInterval = Math.max(1, Math.floor(totalRecords / 10));

      stats.recordsProcessed = totalRecords;
      stats.recordsDecoded = 0;
      stats.errors = 0;
      stats.totalFields = 0;
      stats.skippedFields = 0;

      debugLog(`Starting buffer decoder transform with ${totalRecords} records`);

      const processedRecords = records.map((record: ParsedRecord, index: number) => {
        if (index % logInterval === 0) {
          debugLog(
            `Processing record ${index + 1}/${totalRecords} (${Math.round(
              ((index + 1) / totalRecords) * 100
            )}%)`
          );
        }

        try {
          if (!record.meta || !record.data || !record.header) {
            return record;
          }

          const { processedRecord, hasDecodedFields, recordErrors } = processRecordFields(
            record,
            config,
            decoder
          );

          if (hasDecodedFields) {
            stats.recordsDecoded++;
          }
          if (recordErrors > 0) {
            stats.errors++;
          }

          return processedRecord;
        } catch (error) {
          errorLog(`Failed to process record:`, error);
          stats.errors++;
          return record;
        }
      });

      const duration = Date.now() - startTime;
      debugLog(`===== Buffer Decoder Transform Complete =====`);
      debugLog(`Buffer decoder completed in ${duration}ms`);
      debugLog(`Successfully decoded ${stats.recordsDecoded}/${stats.recordsProcessed} records`);
      if (stats.errors > 0) {
        debugLog(`Encountered ${stats.errors} errors during decoding`);
      }

      return Promise.resolve(processedRecords);
    },

    getStats: () => stats,
  };
}
