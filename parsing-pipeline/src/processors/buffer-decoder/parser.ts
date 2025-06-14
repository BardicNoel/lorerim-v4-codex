import { Buffer } from 'buffer';
import { FieldSchema, ParsedRecord, StringEncoding } from './types';
import { commonFieldSchemas, recordSpecificSchemas } from './schemas';

export class BufferDecoder {
  private getFieldSchema(recordType: string, tag: string): FieldSchema | undefined {
    return recordSpecificSchemas[recordType]?.[tag] || commonFieldSchemas[tag];
  }

  private parseString(buffer: Buffer, offset: number, length: number, encoding: StringEncoding): string {
    return buffer.toString(encoding, offset, offset + length);
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
      }
    }

    return result;
  }

  private getTypeSize(type: string): number {
    switch (type) {
      case 'uint8':
        return 1;
      case 'uint16':
        return 2;
      case 'uint32':
      case 'float32':
        return 4;
      default:
        throw new Error(`Unsupported type size: ${type}`);
    }
  }

  public parseRecord(recordType: string, buffer: Buffer): ParsedRecord {
    const result: ParsedRecord = {};
    let offset = 0;

    while (offset < buffer.length) {
      const tag = buffer.toString('ascii', offset, offset + 4);
      const length = buffer.readUInt16LE(offset + 4);
      const schema = this.getFieldSchema(recordType, tag);

      if (schema) {
        switch (schema.type) {
          case 'string':
            if (!('encoding' in schema)) {
              throw new Error('String field must specify encoding');
            }
            result[tag] = this.parseString(buffer, offset + 6, length, schema.encoding);
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
        }
      }

      offset += 6 + length; // 4 bytes tag + 2 bytes length + data length
    }

    return result;
  }
} 