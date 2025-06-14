import { Buffer } from 'buffer';
import { FieldSchema, ParsedRecord, StringEncoding } from './types';
import { commonFieldSchemas, recordSpecificSchemas } from './schemas';
import { JsonArray, BufferDecoderConfig, JsonRecord } from '../../types/pipeline';
import { Processor } from '../core';
import { formatJSON } from '@lorerim/platform-types';

export class BufferDecoder {
  private getFieldSchema(recordType: string, tag: string): FieldSchema | undefined {
    return recordSpecificSchemas[recordType]?.[tag] || commonFieldSchemas[tag];
  }

  private parseString(buffer: Buffer, offset: number, length: number, encoding: StringEncoding): string {
    return buffer.toString(encoding, offset, offset + length);
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

  private parseStruct(buffer: Buffer, offset: number, length: number, fields: FieldSchema[]): any {
    const result: any = {};
    let currentOffset = offset;

    for (const field of fields) {
      if (!field.name) {
        throw new Error('Struct field must have a name');
      }

      switch (field.type) {
        case 'string':
          if (!('encoding' in field)) {
            throw new Error('String field must specify encoding');
          }
          const stringLength = buffer.readUInt16LE(currentOffset);
          result[field.name] = this.parseString(buffer, currentOffset + 2, stringLength, field.encoding);
          currentOffset += 2 + stringLength;
          break;

        case 'formid':
          result[field.name] = this.parseFormId(buffer, currentOffset);
          currentOffset += 4; // FormId is always 4 bytes
          break;

        case 'uint8':
        case 'uint16':
        case 'uint32':
        case 'float32':
          result[field.name] = this.parseNumeric(buffer, currentOffset, field.type);
          currentOffset += this.getTypeSize(field.type);
          break;

        case 'struct':
          if (!('fields' in field)) {
            throw new Error('Struct field must specify fields');
          }
          const structLength = buffer.readUInt16LE(currentOffset);
          result[field.name] = this.parseStruct(buffer, currentOffset + 2, structLength, field.fields);
          currentOffset += 2 + structLength;
          break;

        case 'array':
          if (!('element' in field)) throw new Error('Array field must specify element');
          const arrayLength = buffer.readUInt16LE(currentOffset);
          result[field.name] = this.parseArray(buffer, currentOffset + 2, arrayLength, field.element);
          currentOffset += 2 + arrayLength;
          break;

        case 'unknown':
          // For unknown fields, we just skip the data
          const unknownLength = buffer.readUInt16LE(currentOffset);
          currentOffset += 2 + unknownLength;
          break;
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
    console.log(`[DEBUG] Starting parseRecord for ${recordType}`);
    console.log(`[DEBUG] Buffer length: ${buffer.length} bytes`);
    console.log(`[DEBUG] Buffer hex: ${buffer.toString('hex')}`);
    
    const result: Record<string, any> = {};
    let offset = 0;
    let fieldCount = 0;

    while (offset < buffer.length) {
      const tag = buffer.toString('ascii', offset, offset + 4);
      const length = buffer.readUInt16LE(offset + 4);
      const schema = this.getFieldSchema(recordType, tag);

      console.log(`[DEBUG] Processing field at offset ${offset}:`);
      console.log(`[DEBUG] - Tag: ${tag}`);
      console.log(`[DEBUG] - Length: ${length}`);
      console.log(`[DEBUG] - Schema found: ${schema ? 'yes' : 'no'}`);
      if (schema) {
        console.log(`[DEBUG] - Schema type: ${schema.type}`);
      }

      if (schema) {
        try {
          switch (schema.type) {
            case 'string':
              if (!('encoding' in schema)) {
                throw new Error('String field must specify encoding');
              }
              console.log(`[DEBUG] - Decoding string with encoding: ${schema.encoding}`);
              result[tag] = this.parseString(buffer, offset + 6, length, schema.encoding);
              console.log(`[DEBUG] - Decoded string: ${result[tag]}`);
              break;

            case 'formid':
              console.log(`[DEBUG] - Decoding formid`);
              result[tag] = this.parseFormId(buffer, offset + 6);
              console.log(`[DEBUG] - Decoded formid: ${result[tag]}`);
              break;

            case 'uint8':
            case 'uint16':
            case 'uint32':
            case 'float32':
              console.log(`[DEBUG] - Decoding numeric: ${schema.type}`);
              result[tag] = this.parseNumeric(buffer, offset + 6, schema.type);
              console.log(`[DEBUG] - Decoded value: ${result[tag]}`);
              break;

            case 'struct':
              if (!('fields' in schema)) {
                throw new Error('Struct field must specify fields');
              }
              console.log(`[DEBUG] - Decoding struct with fields:`, schema.fields);
              result[tag] = this.parseStruct(buffer, offset + 6, length, schema.fields);
              console.log(`[DEBUG] - Decoded struct:`, result[tag]);
              break;

            case 'array':
              if (!('element' in schema)) throw new Error('Array field must specify element');
              console.log(`[DEBUG] - Decoding array with element type: ${schema.element.type}`);
              result[tag] = this.parseArray(buffer, offset + 6, length, schema.element);
              console.log(`[DEBUG] - Decoded array:`, result[tag]);
              break;

            case 'unknown':
              console.log(`[DEBUG] - Skipping unknown field ${tag}`);
              break;
          }
          fieldCount++;
        } catch (error) {
          console.error(`[ERROR] Failed to decode field ${tag}:`, error);
          throw error;
        }
      } else {
        console.log(`[DEBUG] No schema found for field ${tag}, skipping`);
      }

      offset += 6 + length;
      console.log(`[DEBUG] Moving to next field at offset ${offset}`);
    }

    console.log(`[DEBUG] Completed parsing ${recordType} record:`);
    console.log(`[DEBUG] - Total fields processed: ${fieldCount}`);
    console.log(`[DEBUG] - Final result:`, result);
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
      console.log(`\n[DEBUG] ===== Buffer Decoder Transform Start =====`);
      console.log(`[DEBUG] Starting buffer decoder for ${config.recordType} records`);
      console.log(`[DEBUG] Input records structure:`, JSON.stringify(records[0], null, 2));
      
      const startTime = Date.now();
      const totalRecords = records.length;
      console.log(`[DEBUG] Processing ${totalRecords} records`);

      stats.recordsProcessed = totalRecords;
      stats.recordsDecoded = 0;
      stats.errors = 0;
      stats.totalFields = 0;
      stats.skippedFields = 0;

      const processedRecords = records.map((record: ParsedRecord, index: number) => {
        console.log(`\n[DEBUG] ===== Processing Record ${index + 1}/${totalRecords} =====`);
        console.log(`[DEBUG] Record type:`, typeof record);
        console.log(`[DEBUG] Record meta:`, record.meta);
        console.log(`[DEBUG] Record data before processing:`, record.data);
        console.log(`[DEBUG] Record decodedData before processing:`, record.decodedData);
        
        try {
          if (!record.meta || !record.data || !record.header) {
            console.log(`[DEBUG] Invalid record structure, skipping`);
            return record;
          }

          // Create a new record to ensure we don't modify the original
          const processedRecord = {
            ...record,
            decodedData: {} as Record<string, any>  // Type assertion to ensure it's not undefined
          } as ParsedRecord;

          // Process fields containing binary data
          for (const [fieldName, fieldData] of Object.entries(processedRecord.data)) {
            if (Array.isArray(fieldData) && fieldData.length > 0) {
              const firstItem = fieldData[0] as unknown;
              let buffer: Buffer | null = null;

              // Check if it's a direct Buffer
              if (Buffer.isBuffer(firstItem)) {
                buffer = firstItem;
              }
              // Check if it's a serialized Buffer object
              else if (typeof firstItem === 'object' && firstItem !== null && 
                      'type' in firstItem && firstItem.type === 'Buffer' && 
                      'data' in firstItem && Array.isArray(firstItem.data)) {
                buffer = Buffer.from(firstItem.data as number[]);
              }

              if (buffer) {
                console.log(`[DEBUG] Processing field ${fieldName} with binary data:`, {
                  bufferLength: buffer.length,
                  hexPreview: buffer.toString('hex').slice(0, 32) + '...'
                });
                
                try {
                  const decodedField = decoder.parseRecord(config.recordType, buffer);
                  processedRecord.decodedData![fieldName] = decodedField;  // Non-null assertion
                  console.log(`[DEBUG] Successfully decoded field ${fieldName}:`, decodedField);
                } catch (error) {
                  console.error(`[ERROR] Failed to decode field ${fieldName}:`, error);
                }
              }
            }
          }

          console.log(`[DEBUG] Processed record decodedData:`, processedRecord.decodedData);
          return processedRecord;
        } catch (error) {
          console.error(`[ERROR] Failed to process record:`, error);
          stats.errors++;
          // Return the original record if processing fails
          return record;
        }
      });

      const duration = Date.now() - startTime;
      console.log(`\n[DEBUG] ===== Buffer Decoder Transform Complete =====`);
      console.log(`[DEBUG] Buffer decoder completed in ${duration}ms`);
      console.log(`[DEBUG] Successfully decoded ${stats.recordsDecoded}/${stats.recordsProcessed} records`);
      if (stats.errors > 0) {
        console.log(`[DEBUG] Encountered ${stats.errors} errors during decoding`);
      }
      console.log(`[DEBUG] First record after processing:`, formatJSON(processedRecords[0]));
      console.log(`[DEBUG] First record decodedData:`, processedRecords[0]?.decodedData);

      return Promise.resolve(processedRecords);
    },

    getStats: () => stats
  };
}