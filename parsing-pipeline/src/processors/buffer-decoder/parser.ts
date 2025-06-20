import {
  FieldSchema,
  GroupedFieldsSchema,
  ParsedRecord,
  StringEncoding,
  recordSpecificSchemas,
} from './schema';
import { JsonArray, BufferDecoderConfig, JsonRecord } from '../../types/pipeline';
import { Processor } from '../core';
import { formatFormId } from '@lorerim/platform-types';
import { parentPort } from 'worker_threads';

// Error logging function that works in both worker and main thread
function errorLog(message: string, error?: any) {
  console.error(`[ERROR] ${message}`, error);
  if (parentPort) {
    parentPort.postMessage({ type: 'error', message, error: error?.message || error });
  }
}

// Currently doesn't support recursive groups
export class BufferDecoder {
  public getFieldSchema(recordType: string, tag: string): FieldSchema | undefined {
    return recordSpecificSchemas[recordType]?.[tag];
  }

  public parseString(
    buffer: Buffer,
    offset: number,
    encoding: StringEncoding,
    postParse?: (value: string) => any
  ): string {
    const value = buffer.toString(encoding).replace(/\0+$/, '');
    return postParse ? postParse(value) : value;
  }

  public parseFormId(buffer: Buffer, offset: number, postParse?: (value: string) => any): string {
    const formId = formatFormId(buffer.readUInt32LE(offset));

    return postParse ? postParse(formId) : formId;
  }

  public parseNumeric(
    buffer: Buffer,
    offset: number,
    type: string,
    postParse?: (value: number) => any
  ): number {
    // Add debugging for buffer bounds checking
    if (offset < 0 || offset >= buffer.length) {
      console.error(`[ERROR] Buffer bounds error in parseNumeric:`);
      console.error(`[ERROR] Requested offset: ${offset}`);
      console.error(`[ERROR] Buffer length: ${buffer.length}`);
      console.error(`[ERROR] Type: ${type}`);
      console.error(`[ERROR] Available range: 0 to ${buffer.length - 1}`);
      throw new Error(`Buffer offset ${offset} is out of bounds (buffer length: ${buffer.length})`);
    }

    // Check if we have enough bytes for the requested type
    const typeSize = this.getTypeSize(type);
    if (offset + typeSize > buffer.length) {
      console.error(`[ERROR] Insufficient buffer space for type ${type}:`);
      console.error(`[ERROR] Requested offset: ${offset}`);
      console.error(`[ERROR] Type size: ${typeSize}`);
      console.error(`[ERROR] Buffer length: ${buffer.length}`);
      console.error(
        `[ERROR] Would need ${offset + typeSize} bytes, but only have ${buffer.length}`
      );
      throw new Error(`Insufficient buffer space for ${type} at offset ${offset}`);
    }

    let value: number;
    switch (type) {
      case 'uint8':
        value = buffer.readUInt8(offset);
        break;
      case 'uint16':
        value = buffer.readUInt16LE(offset);
        break;
      case 'uint32':
        value = buffer.readUInt32LE(offset);
        break;
      case 'float32':
        value = buffer.readFloatLE(offset);
        break;
      case 'int32':
        value = buffer.readInt32LE(offset);
        break;
      default:
        throw new Error(`Unsupported numeric type: ${type}`);
    }
    return postParse ? postParse(value) : value;
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

    for (const field of fields) {
      if (!field.name) throw new Error('Struct field must have a name');

      switch (field.type) {
        case 'string':
          if (!('encoding' in field)) throw new Error('String field must specify encoding');
          let strLength: number;
          if (useFieldLength) {
            strLength = length;
            result[field.name] = this.parseString(
              buffer,
              currentOffset,
              field.encoding,
              field.parser
            );
            currentOffset += strLength;
          } else {
            strLength = buffer.readUInt16LE(currentOffset);
            result[field.name] = this.parseString(
              buffer,
              currentOffset,
              field.encoding,
              field.parser
            );
            currentOffset += 2 + strLength;
          }
          break;

        case 'formid':
          result[field.name] = this.parseFormId(buffer, currentOffset, field.parser);
          currentOffset += 4;
          break;

        case 'int32':
        case 'uint8':
        case 'uint16':
        case 'uint32':
        case 'float32':
          result[field.name] = this.parseNumeric(buffer, currentOffset, field.type, field.parser);
          currentOffset += this.getTypeSize(field.type);
          break;

        case 'struct':
          if (!('fields' in field)) throw new Error('Struct field must specify fields');
          const structLength = buffer.readUInt16LE(currentOffset);
          result[field.name] = this.parseStruct(
            buffer,
            currentOffset + 2,
            structLength,
            field.fields,
            false
          );
          currentOffset += 2 + structLength;
          break;

        case 'array':
          if (!('element' in field)) throw new Error('Array field must specify element');
          const arrayLength = buffer.readUInt16LE(currentOffset);
          result[field.name] = this.parseArray(
            buffer,
            currentOffset + 2,
            arrayLength,
            field.element
          );
          currentOffset += 2 + arrayLength;
          break;

        case 'unknown':
          const unknownLength = buffer.readUInt16LE(currentOffset);
          currentOffset += 2 + unknownLength;
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

    while (currentOffset < endOffset) {
      switch (elementSchema.type) {
        case 'string':
          if (!('encoding' in elementSchema))
            throw new Error('String element must specify encoding');
          const strLength = buffer.readUInt16LE(currentOffset);
          results.push(
            this.parseString(
              buffer.slice(currentOffset + 2, currentOffset + 2 + strLength),
              0,
              elementSchema.encoding,
              elementSchema.parser
            )
          );
          currentOffset += 2 + strLength;
          break;

        case 'struct':
          if (!('fields' in elementSchema)) throw new Error('Struct element must specify fields');

          let structSize: number;
          if ('size' in elementSchema && typeof elementSchema.size === 'number') {
            structSize = elementSchema.size;
            const structData = this.parseStruct(
              buffer,
              currentOffset,
              structSize,
              elementSchema.fields
            );
            results.push(structData);
            currentOffset += structSize;
          } else {
            const structLength = buffer.readUInt16LE(currentOffset);
            const structData = this.parseStruct(
              buffer,
              currentOffset + 2,
              structLength,
              elementSchema.fields
            );
            results.push(structData);
            currentOffset += 2 + structLength;
          }
          break;

        case 'formid':
          const formId = this.parseFormId(buffer.slice(currentOffset, currentOffset + 4), 0);
          results.push(formId);
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

      if (currentOffset > endOffset) {
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
      case 'int32':
        return 4;
      default:
        throw new Error(`Unsupported type size: ${type}`);
    }
  }
}

function createBufferFromFieldData(fieldData: any[]): Buffer | null {
  if (fieldData.length === 0) {
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

function decodeField(
  fieldName: string,
  fieldData: any[],
  schema: FieldSchema,
  decoder: BufferDecoder,
  recordType: string
): any {
  if (!Array.isArray(fieldData) || fieldData.length === 0) {
    return null;
  }

  const buffer = createBufferFromFieldData(fieldData);
  if (!buffer) {
    return null;
  }

  switch (schema.type) {
    case 'string':
      if (!('encoding' in schema)) throw new Error('String field must specify encoding');
      return decoder.parseString(buffer, 0, schema.encoding, schema.parser);

    case 'formid':
      return decoder.parseFormId(buffer, 0);

    case 'uint8':
    case 'uint16':
    case 'uint32':
    case 'float32':
      return decoder.parseNumeric(buffer, 0, schema.type);

    case 'struct':
      return decoder.parseStruct(buffer, 0, buffer.length, schema.fields);

    case 'array':
      return decoder.parseArray(buffer, 0, buffer.length, schema.element);

    default:
      return null;
  }
}

const parseGroupedFields = (
  parsedRecord: ParsedRecord,
  offset: number,
  { terminatorTag, groupSchema, virtualField }: GroupedFieldsSchema,
  decoder: BufferDecoder
): { decodedField: any; fieldCount: number } => {
  // receives the whole record
  // starts reading fields at the record field offset
  // stops when it reach either the terminator tag or the end of the record
  // returns the decoded fields and a count of how many fields were decoded

  // process group trigger, which will always be the first subrecord
  // the trigger is potentially also a terminator, we must use a while loop to guard against record end
  // and check for terminator tag at the end of the loop, not the beginning

  // Process the first subrecord, which is the group trigger but also sometimes a terminator
  const firstSubrecord = parsedRecord.record[offset];
  const firstSubrecordSchema = groupSchema[firstSubrecord.tag];
  const decodedFirstSubrecord = decodeField(
    firstSubrecord.tag,
    [firstSubrecord.buffer],
    firstSubrecordSchema,
    decoder,
    parsedRecord.meta.type
  );

  const decodedField = {
    [virtualField]: {
      [firstSubrecord.tag]: decodedFirstSubrecord,
    },
  };

  let processedFields = 1;

  while (processedFields + offset < parsedRecord.record.length) {
    const subrecord = parsedRecord.record[processedFields + offset];
    // check for terminator tag
    if (subrecord.tag === terminatorTag) {
      break;
    }

    const decodedSubrecord = decodeField(
      subrecord.tag,
      [subrecord.buffer],
      groupSchema[subrecord.tag],
      decoder,
      parsedRecord.meta.type
    );
    decodedField[virtualField][subrecord.tag] = decodedSubrecord;

    ++processedFields;
  }

  return {
    decodedField,
    fieldCount: processedFields,
  };
};

function processRecordFields(
  record: ParsedRecord,
  config: BufferDecoderConfig,
  decoder: BufferDecoder
): ProcessRecordResult {
  const processedRecord = { ...record } as ParsedRecord;
  let hasDecodedFields = false;
  let recordErrors = 0;

  // Use indexed iterator for order-dependent processing with potential skip-ahead capability
  let i = 0;
  while (i < processedRecord.record.length) {
    const subrecord = processedRecord.record[i];
    const fieldName = subrecord.tag;
    const fieldData = [subrecord.buffer]; // buffer is a base64 string

    try {
      // Get the schema for this field
      const schema = decoder.getFieldSchema(config.recordType, fieldName);

      if (!schema) {
        i++; // Skip to next record if no schema found
        continue;
      }

      let fieldCount = 1; // Default to 1 for non-grouped fields
      const decodedData: Record<string, any> = {};
      if (schema.type === 'grouped') {
        const { decodedField: df, fieldCount: fc } = parseGroupedFields(
          processedRecord,
          i,
          schema,
          decoder
        );
        fieldCount = fc;

        if (schema.cardinality === 'single') {
          decodedData[schema.virtualField] = df;
        } else {
          const existingData = processedRecord.decodedData?.[schema.virtualField] ?? [];
          decodedData[schema.virtualField] = [...existingData, df[schema.virtualField]];
        }
      } else {
        const decodedField = decodeField(fieldName, fieldData, schema, decoder, config.recordType);
        if (decodedField !== null) {
          decodedData[fieldName] = decodedField;
        }
      }

      if (decodedData !== null) {
        if (!processedRecord.decodedData) {
          processedRecord.decodedData = {};
        }

        processedRecord.decodedData = {
          ...processedRecord.decodedData,
          ...decodedData,
        };
        hasDecodedFields = true;
      }

      // Skip ahead by the number of fields processed (supports grouped fields)
      i += fieldCount;
    } catch (error) {
      console.error(`[ERROR] Failed to parse record for ${fieldName}:`, error);
      console.error(`[ERROR] Record EDID: ${record.meta?.type || 'unknown'}`);
      console.error(`[ERROR] Record type: ${config.recordType}`);
      console.error(`[ERROR] Field index: ${i}`);
      console.error(`[ERROR] Total fields in record: ${processedRecord.record.length}`);

      // Show buffer information
      const buffer = createBufferFromFieldData(fieldData);
      if (buffer) {
        console.error(`[ERROR] Buffer length: ${buffer.length}`);
        console.error(
          `[ERROR] Buffer hex (first 32 bytes): ${buffer.toString('hex').substring(0, 64)}`
        );
      } else {
        console.error(`[ERROR] No buffer data available`);
      }

      errorLog(`Failed to decode field ${fieldName}:`, error);
      if (!processedRecord.decodedErrors) {
        processedRecord.decodedErrors = {};
      }
      processedRecord.decodedErrors[fieldName] = {
        error: error instanceof Error ? error.message : String(error),
        fieldPath: `record.${fieldName}`,
        details: {
          bufferLength: fieldData.length > 0 ? createBufferFromFieldData(fieldData)?.length : 0,
          hex: fieldData.length > 0 ? createBufferFromFieldData(fieldData)?.toString('hex') : '',
          recordType: config.recordType,
        },
      };
      recordErrors++;
      i++; // Skip to next record on error
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
      const startTime = Date.now();
      const totalRecords = records.length;
      const logInterval = Math.max(1, Math.floor(totalRecords / 10));

      stats.recordsProcessed = totalRecords;
      stats.recordsDecoded = 0;
      stats.errors = 0;
      stats.totalFields = 0;
      stats.skippedFields = 0;

      const processedRecords = records.map((record: ParsedRecord, index: number) => {
        if (index % logInterval === 0) {
          console.log(
            `Processing record ${index + 1}/${totalRecords} (${Math.round(
              ((index + 1) / totalRecords) * 100
            )}%)`
          );
        }

        try {
          if (!record.meta || !record.record || !record.header) {
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
      console.log(`===== Buffer Decoder Transform Complete =====`);
      console.log(`Buffer decoder completed in ${duration}ms`);
      console.log(`Successfully decoded ${stats.recordsDecoded}/${stats.recordsProcessed} records`);
      if (stats.errors > 0) {
        console.log(`Encountered ${stats.errors} errors during decoding`);
      }

      return Promise.resolve(processedRecords);
    },

    getStats: () => stats,
  };
}
