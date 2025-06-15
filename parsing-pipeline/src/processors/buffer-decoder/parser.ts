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
  private getFieldSchema(recordType: string, tag: string): FieldSchema | undefined {
    return recordSpecificSchemas[recordType]?.[tag] || commonFieldSchemas[tag];
  }

  private parseString(buffer: Buffer, offset: number, length: number, encoding: StringEncoding): string {
    // For UTF-8 strings, we need to handle null termination
    if (encoding === 'utf8') {
      const nullTerminator = buffer.indexOf(0, offset);
      const end = nullTerminator === -1 ? offset + length : nullTerminator;
      return buffer.toString('utf8', offset, end);
    }
    // For UTF-16LE strings, we need to handle null termination
    else if (encoding === 'utf16le') {
      const nullTerminator = buffer.indexOf(0, offset);
      const end = nullTerminator === -1 ? offset + length : nullTerminator;
      return buffer.toString('utf16le', offset, end);
    }
    throw new Error(`Unsupported string encoding: ${encoding}`);
  }

  private parseFormId(buffer: Buffer, offset: number): string {
    // Read 4 bytes as UTF-8 little-endian
    return buffer.toString('utf8', offset, offset + 4);
  }

  private parseNumeric(buffer: Buffer, offset: number, type: string): number {
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

  private parseStruct(buffer: Buffer, offset: number, length: number, fields: FieldSchema[], useFieldLength = true): any {
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
            // subrecord already defined length externally
            strLength = length;
            result[field.name] = this.parseString(buffer, currentOffset, strLength, field.encoding);
            currentOffset += strLength;
          } else {
            // struct-internal strings are length-prefixed
            strLength = buffer.readUInt16LE(currentOffset);
            result[field.name] = this.parseString(buffer, currentOffset + 2, strLength, field.encoding);
            currentOffset += 2 + strLength;
          }
          break;
  
        case 'formid':
          result[field.name] = this.parseFormId(buffer, currentOffset);
          currentOffset += 4;
          break;
  
        case 'uint8':
        case 'uint16':
        case 'uint32':
        case 'float32':
          result[field.name] = this.parseNumeric(buffer, currentOffset, field.type);
          currentOffset += this.getTypeSize(field.type);
          break;
  
        case 'struct':
          if (!('fields' in field)) throw new Error('Struct field must specify fields');
          const structLength = buffer.readUInt16LE(currentOffset);
          result[field.name] = this.parseStruct(buffer, currentOffset + 2, structLength, field.fields, false);
          currentOffset += 2 + structLength;
          break;
  
        case 'array':
          if (!('element' in field)) throw new Error('Array field must specify element');
          const arrayLength = buffer.readUInt16LE(currentOffset);
          result[field.name] = this.parseArray(buffer, currentOffset + 2, arrayLength, field.element);
          currentOffset += 2 + arrayLength;
          break;
  
        case 'unknown':
          const unknownLength = buffer.readUInt16LE(currentOffset);
          currentOffset += 2 + unknownLength;
          break;
      }
  
      if (currentOffset > endOffset) {
        throw new Error(`Struct parsing overran bounds for ${field.name}`);
      }
    }
  
    return result;
  }
  
  private parseArray(buffer: Buffer, offset: number, length: number, elementSchema: FieldSchema): any[] {
    const results = [];
    let currentOffset = offset;
    const end = offset + length;

    while (currentOffset < end) {
      switch (elementSchema.type) {
        case 'struct':
          if (!('fields' in elementSchema)) throw new Error('Array element struct must specify fields');
          const structLength = buffer.readUInt16LE(currentOffset);
          const structData = this.parseStruct(buffer, currentOffset + 2, structLength, elementSchema.fields);
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

  public parseRecord(recordType: string, buffer: Buffer): Record<string, any> {
    debugLog(`Starting parseRecord for type ${recordType}, buffer length: ${buffer.length}`);
    const result: Record<string, any> = {};
    let offset = 0;
    let fieldCount = 0;

    while (offset < buffer.length) {
      const tag = buffer.toString('ascii', offset, offset + 4);
      const length = buffer.readUInt16LE(offset + 4);
      const schema = this.getFieldSchema(recordType, tag);

      debugLog(`Processing field ${tag} at offset ${offset}, length ${length}, has schema: ${!!schema}`);

      if (schema) {
        try {
          switch (schema.type) {
            case 'string':
              if (!('encoding' in schema)) {
                throw new Error('String field must specify encoding');
              }
              result[tag] = this.parseString(buffer, offset + 6, length, schema.encoding);
              debugLog(`Parsed string field ${tag}: ${result[tag]}`);
              break;

            case 'formid':
              result[tag] = this.parseFormId(buffer, offset + 6);
              debugLog(`Parsed formid field ${tag}: ${result[tag]}`);
              break;

            case 'uint8':
            case 'uint16':
            case 'uint32':
            case 'float32':
              result[tag] = this.parseNumeric(buffer, offset + 6, schema.type);
              debugLog(`Parsed numeric field ${tag}: ${result[tag]}`);
              break;

            case 'struct':
              if (!('fields' in schema)) {
                throw new Error('Struct field must specify fields');
              }
              result[tag] = this.parseStruct(buffer, offset + 6, length, schema.fields);
              debugLog(`Parsed struct field ${tag}:`, result[tag]);
              break;

            case 'array':
              if (!('element' in schema)) throw new Error('Array field must specify element');
              result[tag] = this.parseArray(buffer, offset + 6, length, schema.element);
              debugLog(`Parsed array field ${tag}, length: ${result[tag].length}`);
              break;

            case 'unknown':
              debugLog(`Skipping unknown field ${tag}`);
              break;
          }
          fieldCount++;
        } catch (error) {
          errorLog(`Failed to decode field ${tag}:`, error);
          errorLog(`Buffer context:`, {
            offset,
            length,
            hex: buffer.slice(offset, offset + 6 + length).toString('hex'),
            recordType,
            tag
          });
          throw error;
        }
      } else {
        debugLog(`No schema found for field ${tag}, skipping`);
      }

      offset += 6 + length;
    }

    debugLog(`Completed parseRecord for ${recordType}, processed ${fieldCount} fields`);
    return result;
  }
}

export function createBufferDecoderProcessor(config: BufferDecoderConfig): Processor {
  const decoder = new BufferDecoder();
  let stats = {
    recordsProcessed: 0,
    recordsDecoded: 0,
    errors: 0,
    totalFields: 0,
    skippedFields: 0
  };

  return {
    transform(records: JsonArray): Promise<JsonArray> {
      // Write first few records to file for inspection
      const debugRecords = records.slice(0, 5).map(record => ({
        meta: record.meta,
        data: Object.entries(record.data).reduce((acc, [key, value]) => {
          acc[key] = {
            isArray: Array.isArray(value),
            length: Array.isArray(value) ? value.length : 0,
            firstItem: Array.isArray(value) && value.length > 0 ? {
              type: typeof value[0],
              value: value[0],
              isBuffer: Buffer.isBuffer(value[0]),
              keys: typeof value[0] === 'object' ? Object.keys(value[0]) : null,
              stringified: JSON.stringify(value[0], null, 2)
            } : null
          };
          return acc;
        }, {} as Record<string, any>)
      }));

      const debugOutput = {
        totalRecords: records.length,
        sampleRecords: debugRecords,
        config
      };

      writeFileSync(
        join(process.cwd(), 'buffer-debug-output.json'),
        formatJSON(debugOutput)
      );

      debugLog(`Wrote debug output to buffer-debug-output.json`);

      // Basic verification logging
      if (parentPort) {
        parentPort.postMessage({ type: 'debug', message: 'Buffer decoder transform started' });
      }
      console.log('Buffer decoder transform started - direct console log');
      
      const startTime = Date.now();
      const totalRecords = records.length;
      
      // Log basic record info
      if (parentPort) {
        parentPort.postMessage({ 
          type: 'debug', 
          message: 'Record info',
          data: {
            totalRecords,
            firstRecordType: records[0]?.meta?.type,
            hasRecords: records.length > 0
          }
        });
      }
      console.log('Record info:', {
        totalRecords,
        firstRecordType: records[0]?.meta?.type,
        hasRecords: records.length > 0
      });

      const logInterval = Math.max(1, Math.floor(totalRecords / 10)); // Log every ~10% of records

      stats.recordsProcessed = totalRecords;
      stats.recordsDecoded = 0;
      stats.errors = 0;
      stats.totalFields = 0;
      stats.skippedFields = 0;

      debugLog(`Starting buffer decoder transform with ${totalRecords} records`);

      const processedRecords = records.map((record: ParsedRecord, index: number) => {
        if (index % logInterval === 0) {
          debugLog(`Processing record ${index + 1}/${totalRecords} (${Math.round((index + 1) / totalRecords * 100)}%)`);
        }

        try {
          if (!record.meta || !record.data || !record.header) {
            debugLog(`Invalid record structure, skipping`);
            return record;
          }

          // Create a new record to ensure we don't modify the original
          const processedRecord = {
            ...record,
          } as ParsedRecord;

          let hasDecodedFields = false;
          let recordErrors = 0;

          // Process fields containing binary data
          for (const [fieldName, fieldData] of Object.entries(processedRecord.data)) {
            debugLog(`Checking field ${fieldName}:`, {
              isArray: Array.isArray(fieldData),
              length: Array.isArray(fieldData) ? fieldData.length : 0,
              firstItemType: Array.isArray(fieldData) && fieldData.length > 0 ? typeof fieldData[0] : 'none',
              firstItem: Array.isArray(fieldData) && fieldData.length > 0 ? fieldData[0] : null
            });

            if (Array.isArray(fieldData) && fieldData.length > 0) {
              const firstItem = fieldData[0] as unknown;
              let buffer: Buffer | null = null;

              // Check if it's a direct Buffer
              if (Buffer.isBuffer(firstItem)) {
                debugLog(`Found direct Buffer for ${fieldName}`);
                buffer = firstItem;
              }
              // Check if it's a serialized Buffer object
              else if (typeof firstItem === 'object' && firstItem !== null) {
                debugLog(`Checking object for ${fieldName}:`, {
                  hasType: 'type' in firstItem,
                  hasData: 'data' in firstItem,
                  type: 'type' in firstItem ? firstItem.type : undefined,
                  isDataArray: 'data' in firstItem ? Array.isArray(firstItem.data) : false,
                  objectKeys: Object.keys(firstItem),
                  objectValues: Object.values(firstItem)
                });

                // Try to create buffer from the object's data
                if ('data' in firstItem) {
                  try {
                    if (Array.isArray(firstItem.data)) {
                      debugLog(`Attempting to create buffer from array data for ${fieldName}`);
                      buffer = Buffer.from(firstItem.data as number[]);
                    } else if (typeof firstItem.data === 'string') {
                      debugLog(`Attempting to create buffer from string data for ${fieldName}`);
                      buffer = Buffer.from(firstItem.data, 'base64');
                    }
                  } catch (error) {
                    debugLog(`Failed to create buffer from data for ${fieldName}:`, error);
                  }
                }
              }

              if (buffer) {
                try {
                  debugLog(`Processing buffer for field ${fieldName}:`, {
                    length: buffer.length,
                    hex: buffer.toString('hex').slice(0, 32),
                    recordType: config.recordType
                  });

                  const decodedField = decoder.parseRecord(config.recordType, buffer);
                  debugLog(`Decoded field ${fieldName}:`, {
                    original: fieldData[0],
                    decoded: decodedField,
                    recordType: config.recordType
                  });
                  processedRecord.decodedData![fieldName] = decodedField;
                  hasDecodedFields = true;
                } catch (error) {
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
                      recordType: config.recordType
                    }
                  };
                  recordErrors++;
                }
              } else {
                debugLog(`No valid buffer found for field ${fieldName}`);
              }
            }
          }

          // Update stats
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

    getStats: () => stats
  };
}
