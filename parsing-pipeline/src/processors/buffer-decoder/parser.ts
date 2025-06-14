import { Buffer } from 'buffer';
import { FieldSchema, ParsedRecord, StringEncoding } from './types';
import { commonFieldSchemas, recordSpecificSchemas } from './schemas';
import { JsonArray, BufferDecoderConfig, JsonRecord } from '../../types/pipeline';
import { Processor } from '../core';

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
    console.log(`[DEBUG] Decoding ${recordType} record (${buffer.length} bytes)`);
    const result: Record<string, any> = {};
    let offset = 0;
    let fieldCount = 0;

    while (offset < buffer.length) {
      const tag = buffer.toString('ascii', offset, offset + 4);
      const length = buffer.readUInt16LE(offset + 4);
      const schema = this.getFieldSchema(recordType, tag);

      if (schema) {
        console.log(`[DEBUG] Processing field ${tag} (${length} bytes)`);
        switch (schema.type) {
          case 'string':
            if (!('encoding' in schema)) {
              throw new Error('String field must specify encoding');
            }
            result[tag] = this.parseString(buffer, offset + 6, length, schema.encoding);
            break;

          case 'formid':
            result[tag] = this.parseFormId(buffer, offset + 6);
            break;

          case 'uint8':
          case 'uint16':
          case 'uint32':
          case 'float32':
            result[tag] = this.parseNumeric(buffer, offset + 6, schema.type);
            break;

          case 'struct':
            if (!('fields' in schema)) {
              throw new Error('Struct field must specify fields');
            }
            result[tag] = this.parseStruct(buffer, offset + 6, length, schema.fields);
            break;

          case 'array':
            if (!('element' in schema)) throw new Error('Array field must specify element');
            result[tag] = this.parseArray(buffer, offset + 6, length, schema.element);
            break;

          case 'unknown':
            console.log(`[DEBUG] Skipping unknown field ${tag}`);
            break;
        }
        fieldCount++;
      } else {
        console.log(`[DEBUG] No schema found for field ${tag}, skipping`);
      }

      offset += 6 + length; // 4 bytes tag + 2 bytes length + data length
    }

    console.log(`[DEBUG] Completed decoding ${recordType} record (${fieldCount} fields)`);
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
      console.log(`[DEBUG] Starting buffer decoder for ${config.recordType} records`);
      const startTime = Date.now();
      const totalRecords = records.length;
      console.log(`[DEBUG] Processing ${totalRecords} records`);

      stats.recordsProcessed = totalRecords;
      stats.recordsDecoded = 0;
      stats.errors = 0;
      stats.totalFields = 0;
      stats.skippedFields = 0;

      const processedRecords = records.map((record: ParsedRecord) => {
        console.log(`[DEBUG] Processing record:`, record);
        try {
          if (!record.meta || !record.data || !record.header) {
            console.log(`[DEBUG] Invalid record structure, skipping`);
            return record;
          }

          // Get the DATA field which contains the binary data
          const dataField = record.data.DATA?.[0];
          
          if (!dataField) {
            console.log(`[DEBUG] No DATA field found, skipping`);
            return record;
          }

          // Convert the data to a Buffer if it's not already
          const binaryData = Buffer.isBuffer(dataField) ? dataField : Buffer.from(dataField);
          console.log(`[DEBUG] Decoding ${config.recordType} record (${binaryData.length} bytes)`);

          // Decode the record
          const decodedData = decoder.parseRecord(config.recordType, binaryData);
          console.log(`[DEBUG] Successfully decoded record`);

          // Update the record: keep DATA as Buffer[], add DATA_DECODED for decoded object
          const updatedRecord: ParsedRecord = {
            ...record,
            decodedData: decodedData,
          };

          stats.recordsDecoded++;
          return updatedRecord;
        } catch (error) {
          console.error(`[ERROR] Failed to process record:`, error);
          stats.errors++;
          return record;
        }
      });

      const duration = Date.now() - startTime;
      console.log(`[DEBUG] Buffer decoder completed in ${duration}ms`);
      console.log(`[DEBUG] Successfully decoded ${stats.recordsDecoded}/${stats.recordsProcessed} records`);
      if (stats.errors > 0) {
        console.log(`[DEBUG] Encountered ${stats.errors} errors during decoding`);
      }

      return Promise.resolve(processedRecords);
    },

    getStats: () => stats
  };
} 