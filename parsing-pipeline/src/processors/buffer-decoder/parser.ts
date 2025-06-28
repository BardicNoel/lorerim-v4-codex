import {
  FieldSchema,
  GroupedFieldsSchema,
  ParsedRecord,
  StringEncoding,
  recordSpecificSchemas,
  RecordSpecificSchemas,
} from './schema';
import { JsonArray, BufferDecoderConfig, JsonRecord } from '../../types/pipeline';
import { Processor } from '../core';
import { extractSubrecords, formatFormId, PluginMeta } from '@lorerim/platform-types';
import { resolveGlobalFromReference } from '@lorerim/platform-types';
import { parentPort, Worker } from 'worker_threads';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import * as iconv from 'iconv-lite';

// Warning suppression to prevent log flooding
const warningSuppression = new Set<string>();

function logWarningOnce(message: string, key?: string): void {
  const warningKey = key || message;
  if (!warningSuppression.has(warningKey)) {
    console.warn(message);
    warningSuppression.add(warningKey);
  }
}

// Error logging function that works in both worker and main thread
export function errorLog(message: string, error?: any) {
  console.error(`[ERROR] ${message}`, error);
  if (parentPort) {
    parentPort.postMessage({ type: 'error', message, error: error?.message || error });
  }
}

// Helper function to extract FormID from record metadata
export function getFormIdFromRecord(record: ParsedRecord): string {
  if (record.meta?.globalFormId) {
    return record.meta.globalFormId;
  }
  if (record.meta?.formId) {
    return record.meta.formId;
  }
  return 'unknown';
}

// Currently doesn't support recursive groups
export class BufferDecoder {
  private pluginRegistry: Record<string, PluginMeta> = {};
  private pluginMetadataLoaded = false;

  public getFieldSchema(recordType: string, tag: string): FieldSchema | undefined {
    return recordSpecificSchemas[recordType]?.[tag];
  }

  /**
   * Loads plugin metadata from the specified path or automatically discovers it
   */
  public async loadPluginMetadata(inputFilePath?: string, metadataPath?: string): Promise<void> {
    if (this.pluginMetadataLoaded) {
      return; // Already loaded
    }

    try {
      let metadataFilePath: string;

      if (metadataPath) {
        // Use explicitly provided path
        metadataFilePath = path.resolve(metadataPath);
      } else if (inputFilePath) {
        // Auto-discover in parent directory of input file
        const parentDir = path.dirname(path.resolve(inputFilePath));
        metadataFilePath = path.join(parentDir, 'plugin-metadata-map.json');
      } else {
        throw new Error(
          'Cannot load plugin metadata: no input file path or metadata path provided'
        );
      }

      console.log(`[DEBUG] Loading plugin metadata from: ${metadataFilePath}`);

      if (
        !(await fs
          .access(metadataFilePath)
          .then(() => true)
          .catch(() => false))
      ) {
        console.warn(`[WARN] Plugin metadata file not found at: ${metadataFilePath}`);
        this.pluginMetadataLoaded = true; // Mark as loaded to avoid repeated attempts
        return;
      }

      const metadataContent = await fs.readFile(metadataFilePath, 'utf-8');
      const metadata = JSON.parse(metadataContent);

      // Convert to the expected format: Record<string, PluginMeta>
      this.pluginRegistry = metadata;

      console.log(
        `[DEBUG] Loaded ${Object.keys(this.pluginRegistry).length} plugin metadata entries`
      );
      this.pluginMetadataLoaded = true;
    } catch (error) {
      console.error(`[ERROR] Failed to load plugin metadata:`, error);
      this.pluginMetadataLoaded = true; // Mark as loaded to avoid repeated attempts
    }
  }

  /**
   * Resolves a raw FormID to a global FormID using plugin metadata
   */
  private resolveFormId(rawFormId: number, contextPluginName: string): string {
    if (!this.pluginMetadataLoaded || Object.keys(this.pluginRegistry).length === 0) {
      console.warn('No plugin metadata loaded, using raw FormID');
      // Fall back to simple formatting if no metadata available
      return formatFormId(rawFormId);
    }

    const contextPlugin = this.pluginRegistry[contextPluginName];
    if (!contextPlugin) {
      console.warn(
        `[WARN] Context plugin "${contextPluginName}" not found in registry, using raw FormID`
      );
      return formatFormId(rawFormId);
    }

    // Debug: Show FormID in hex format only for failed resolutions
    const fileIndex = (rawFormId >>> 24) & 0xff;
    const localID = rawFormId & 0x00ffffff;

    const globalFormId = resolveGlobalFromReference(rawFormId, contextPlugin, this.pluginRegistry);
    if (globalFormId === null) {
      console.warn(
        `[WARN] Failed to resolve FormID 0x${rawFormId.toString(16).padStart(8, '0').toUpperCase()} (fileIndex: ${fileIndex}, localID: 0x${localID.toString(16).padStart(6, '0').toUpperCase()}) for plugin ${contextPluginName}, using raw FormID`
      );
      process.exit(1); // temporary during debugging
      return formatFormId(rawFormId);
    }

    return formatFormId(globalFormId);
  }

  public parseString(
    buffer: Buffer,
    offset: number,
    encoding: StringEncoding,
    postParse?: (value: string) => any
  ): string {
    let value: string;

    // Handle different encodings
    switch (encoding) {
      case 'windows-1252':
        // Use iconv-lite for proper Windows-1252 support
        value = iconv.decode(buffer, 'win1252').replace(/\0+$/, '');
        break;
      case 'utf8':
      case 'utf16le':
      case 'ascii':
        value = buffer.toString(encoding).replace(/\0+$/, '');
        break;
      default:
        throw new Error(`Unsupported encoding: ${encoding}`);
    }

    return postParse ? postParse(value) : value;
  }

  public parseFormId(
    buffer: Buffer,
    offset: number,
    postParse?: (value: string) => any,
    contextPluginName?: string
  ): string {
    const rawFormId = buffer.readUInt32LE(offset);

    // Use global resolution if context plugin is provided and metadata is loaded
    const formId = contextPluginName
      ? this.resolveFormId(rawFormId, contextPluginName)
      : formatFormId(rawFormId);

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
    useFieldLength = true,
    contextPluginName?: string,
    formId?: string
  ): any {
    const result: any = {};
    let currentOffset = offset;
    const endOffset = offset + length;

    for (let fieldIndex = 0; fieldIndex < fields.length; fieldIndex++) {
      const field = fields[fieldIndex];
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
            if (currentOffset + 2 + strLength > buffer.length) {
              console.error(`[ERROR] parseStruct: String would exceed buffer bounds!`);
              console.error(
                `[ERROR] parseStruct: Field: ${field.name}, Current offset: ${currentOffset}, String length: ${strLength}, Buffer length: ${buffer.length}`
              );
              console.error(
                `[ERROR] parseStruct: Would need ${currentOffset + 2 + strLength} bytes`
              );
              if (formId) {
                console.error(`[ERROR] parseStruct: Record FormID: ${formId}`);
              }
              throw new Error(`String field ${field.name} would exceed buffer bounds`);
            }
            result[field.name] = this.parseString(
              buffer,
              currentOffset + 2,
              field.encoding,
              field.parser
            );
            currentOffset += 2 + strLength;
          }
          break;

        case 'formid':
          if (currentOffset + 4 > buffer.length) {
            console.error(`[ERROR] parseStruct: FormID would exceed buffer bounds!`);
            console.error(
              `[ERROR] parseStruct: Field: ${field.name}, Current offset: ${currentOffset}, Buffer length: ${buffer.length}`
            );
            if (formId) {
              console.error(`[ERROR] parseStruct: Record FormID: ${formId}`);
            }
            throw new Error(`FormID field ${field.name} would exceed buffer bounds`);
          }
          result[field.name] = this.parseFormId(
            buffer,
            currentOffset,
            field.parser,
            contextPluginName
          );
          currentOffset += 4;
          break;

        case 'int32':
        case 'uint8':
        case 'uint16':
        case 'uint32':
        case 'float32':
          const typeSize = this.getTypeSize(field.type);
          if (currentOffset + typeSize > buffer.length) {
            console.error(`[ERROR] parseStruct: Numeric field would exceed buffer bounds!`);
            console.error(
              `[ERROR] parseStruct: Field: ${field.name}, Type: ${field.type}, Current offset: ${currentOffset}, Type size: ${typeSize}, Buffer length: ${buffer.length}`
            );
            if (formId) {
              console.error(`[ERROR] parseStruct: Record FormID: ${formId}`);
            }
            throw new Error(`Numeric field ${field.name} would exceed buffer bounds`);
          }
          result[field.name] = this.parseNumeric(buffer, currentOffset, field.type, field.parser);
          currentOffset += typeSize;
          break;

        case 'struct':
          if (!('fields' in field)) throw new Error('Struct field must specify fields');
          const structLength = buffer.readUInt16LE(currentOffset);
          if (currentOffset + 2 + structLength > buffer.length) {
            console.error(`[ERROR] parseStruct: Nested struct would exceed buffer bounds!`);
            console.error(
              `[ERROR] parseStruct: Field: ${field.name}, Current offset: ${currentOffset}, Struct length: ${structLength}, Buffer length: ${buffer.length}`
            );
            console.error(
              `[ERROR] parseStruct: Would need ${currentOffset + 2 + structLength} bytes`
            );
            if (formId) {
              console.error(`[ERROR] parseStruct: Record FormID: ${formId}`);
            }
            throw new Error(`Nested struct field ${field.name} would exceed buffer bounds`);
          }
          result[field.name] = this.parseStruct(
            buffer,
            currentOffset + 2,
            structLength,
            field.fields,
            false,
            contextPluginName,
            formId
          );
          currentOffset += 2 + structLength;
          break;

        case 'array':
          if (!('element' in field)) throw new Error('Array field must specify element');
          const arrayLength = buffer.readUInt16LE(currentOffset);
          if (currentOffset + 2 + arrayLength > buffer.length) {
            console.error(`[ERROR] parseStruct: Array would exceed buffer bounds!`);
            console.error(
              `[ERROR] parseStruct: Field: ${field.name}, Current offset: ${currentOffset}, Array length: ${arrayLength}, Buffer length: ${buffer.length}`
            );
            console.error(
              `[ERROR] parseStruct: Would need ${currentOffset + 2 + arrayLength} bytes`
            );
            if (formId) {
              console.error(`[ERROR] parseStruct: Record FormID: ${formId}`);
            }
            throw new Error(`Array field ${field.name} would exceed buffer bounds`);
          }
          result[field.name] = this.parseArray(
            buffer,
            currentOffset + 2,
            arrayLength,
            field.element,
            contextPluginName
          );
          currentOffset += 2 + arrayLength;
          break;

        case 'unknown':
          const unknownLength = buffer.readUInt16LE(currentOffset);
          if (currentOffset + 2 + unknownLength > buffer.length) {
            console.error(`[ERROR] parseStruct: Unknown field would exceed buffer bounds!`);
            console.error(
              `[ERROR] parseStruct: Field: ${field.name}, Current offset: ${currentOffset}, Unknown length: ${unknownLength}, Buffer length: ${buffer.length}`
            );
            if (formId) {
              console.error(`[ERROR] parseStruct: Record FormID: ${formId}`);
            }
            throw new Error(`Unknown field ${field.name} would exceed buffer bounds`);
          }
          currentOffset += 2 + unknownLength;
          break;
      }

      if (currentOffset > endOffset) {
        console.error(`[ERROR] parseStruct: Buffer overrun detected for field "${field.name}"`);
        console.error(
          `[ERROR] parseStruct: Current offset: ${currentOffset}, End offset: ${endOffset}`
        );
        console.error(`[ERROR] parseStruct: Overrun by: ${currentOffset - endOffset} bytes`);
        console.error(`[ERROR] parseStruct: Field type: ${field.type}`);
        console.error(`[ERROR] parseStruct: Buffer length: ${buffer.length}`);
        if (formId) {
          console.error(`[ERROR] parseStruct: Record FormID: ${formId}`);
        }
        throw new Error(`Struct parsing overran bounds for ${field.name}`);
      }
    }

    return result;
  }

  public parseArray(
    buffer: Buffer,
    offset: number,
    length: number,
    elementSchema: FieldSchema,
    contextPluginName?: string
  ): any[] {
    const results: any[] = [];
    let currentOffset = offset;
    const endOffset = offset + length;

    // Special handling for VMAD arrays that use remaining buffer space
    const isVMADArray =
      elementSchema.type === 'struct' &&
      'fields' in elementSchema &&
      elementSchema.fields.some((f) => f.name === 'scriptName' || f.name === 'propertyName');

    // For VMAD arrays, use the actual buffer length instead of the provided length
    const actualEndOffset = isVMADArray ? buffer.length : endOffset;

    // if (isVMADArray) {
    //   console.log(
    //     `[DEBUG] parseArray: VMAD array - start: ${offset}, buffer length: ${buffer.length}, element type: ${elementSchema.type}`
    //   );
    // }

    while (currentOffset < actualEndOffset) {
      // Check if we have enough buffer space for the next element
      if (currentOffset >= buffer.length) {
        logWarningOnce(
          `[WARN] parseArray: Array parsing reached buffer end at offset ${currentOffset}, stopping`,
          `buffer_end_${currentOffset}`
        );
        break;
      }

      switch (elementSchema.type) {
        case 'string':
          if (!('encoding' in elementSchema))
            throw new Error('String element must specify encoding');
          const strLength = buffer.readUInt16LE(currentOffset);
          if (currentOffset + 2 + strLength > buffer.length) {
            logWarningOnce(
              `[WARN] parseArray: String element would exceed buffer bounds, stopping array parsing`,
              `string_bounds_${currentOffset}_${strLength}_${buffer.length}`
            );
            break;
          }
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
            if (currentOffset + structSize > buffer.length) {
              logWarningOnce(
                `[WARN] parseArray: Struct element would exceed buffer bounds, stopping array parsing`,
                `struct_fixed_bounds_${currentOffset}_${structSize}_${buffer.length}`
              );
              break;
            }
            const structData = this.parseStruct(
              buffer,
              currentOffset,
              structSize,
              elementSchema.fields,
              false,
              contextPluginName
            );
            results.push(structData);
            currentOffset += structSize;
          } else {
            const structLength = buffer.readUInt16LE(currentOffset);
            if (currentOffset + 2 + structLength > buffer.length) {
              logWarningOnce(
                `[WARN] parseArray: Struct element would exceed buffer bounds, stopping array parsing`,
                `struct_var_bounds_${currentOffset}_${structLength}_${buffer.length}`
              );
              break;
            }
            const structData = this.parseStruct(
              buffer,
              currentOffset + 2,
              structLength,
              elementSchema.fields,
              false,
              contextPluginName
            );
            results.push(structData);
            currentOffset += 2 + structLength;
          }
          break;

        case 'formid':
          if (currentOffset + 4 > buffer.length) {
            logWarningOnce(
              `[WARN] parseArray: FormID element would exceed buffer bounds, stopping array parsing`,
              `formid_bounds_${currentOffset}_${buffer.length}`
            );
            break;
          }
          const formId = this.parseFormId(
            buffer.slice(currentOffset, currentOffset + 4),
            0,
            undefined,
            contextPluginName
          );
          results.push(formId);
          currentOffset += 4;
          break;

        case 'uint8':
        case 'uint16':
        case 'uint32':
        case 'float32':
          const typeSize = this.getTypeSize(elementSchema.type);
          if (currentOffset + typeSize > buffer.length) {
            logWarningOnce(
              `[WARN] parseArray: ${elementSchema.type} element would exceed buffer bounds, stopping array parsing`,
              `${elementSchema.type}_bounds_${currentOffset}_${typeSize}_${buffer.length}`
            );
            break;
          }
          results.push(
            this.parseNumeric(buffer, currentOffset, elementSchema.type, elementSchema.parser)
          );
          currentOffset += typeSize;
          break;

        default:
          throw new Error(`Unsupported array element type: ${elementSchema.type}`);
      }

      if (currentOffset > actualEndOffset) {
        console.error(`[ERROR] parseArray: Array parsing overran bounds!`);
        console.error(
          `[ERROR] parseArray: Current offset: ${currentOffset}, End offset: ${actualEndOffset}`
        );
        console.error(`[ERROR] parseArray: Overrun by: ${currentOffset - actualEndOffset} bytes`);
        throw new Error('Array parsing overran bounds');
      }
    }

    // Only log completion for VMAD arrays
    // if (isVMADArray) {
    //   console.log(
    //     `[DEBUG] parseArray: VMAD array completed - processed ${results.length} elements, final offset: ${currentOffset}`
    //   );
    // }

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

  /**
   * Parse a buffer using a referenced schema
   */
  public parseRecordWithSchema(
    buffer: Buffer,
    schema: RecordSpecificSchemas[string],
    contextPluginName?: string
  ): any {
    const result: any = {};
    let currentOffset = 0;

    // Iterate through the schema fields and parse them
    for (const [fieldName, fieldSchema] of Object.entries(schema)) {
      if (currentOffset >= buffer.length) {
        break; // Stop if we've reached the end of the buffer
      }

      try {
        const typedFieldSchema = fieldSchema as FieldSchema;

        switch (typedFieldSchema.type) {
          case 'string':
            if (!('encoding' in typedFieldSchema)) continue;
            const strLength = buffer.readUInt16LE(currentOffset);
            if (currentOffset + 2 + strLength > buffer.length) break;
            result[fieldName] = this.parseString(
              buffer,
              currentOffset + 2,
              typedFieldSchema.encoding,
              typedFieldSchema.parser
            );
            currentOffset += 2 + strLength;
            break;

          case 'formid':
            if (currentOffset + 4 > buffer.length) break;
            result[fieldName] = this.parseFormId(
              buffer,
              currentOffset,
              typedFieldSchema.parser,
              contextPluginName
            );
            currentOffset += 4;
            break;

          case 'uint8':
          case 'uint16':
          case 'uint32':
          case 'float32':
          case 'int32':
            const typeSize = this.getTypeSize(typedFieldSchema.type);
            if (currentOffset + typeSize > buffer.length) break;
            result[fieldName] = this.parseNumeric(
              buffer,
              currentOffset,
              typedFieldSchema.type,
              typedFieldSchema.parser
            );
            currentOffset += typeSize;
            break;

          case 'struct':
            if (!('fields' in typedFieldSchema)) continue;
            const structLength = buffer.readUInt16LE(currentOffset);
            if (currentOffset + 2 + structLength > buffer.length) break;
            result[fieldName] = this.parseStruct(
              buffer,
              currentOffset + 2,
              structLength,
              typedFieldSchema.fields,
              false,
              contextPluginName
            );
            currentOffset += 2 + structLength;
            break;

          case 'array':
            if (!('element' in typedFieldSchema)) continue;
            const arrayLength = buffer.readUInt16LE(currentOffset);
            if (currentOffset + 2 + arrayLength > buffer.length) break;
            result[fieldName] = this.parseArray(
              buffer,
              currentOffset + 2,
              arrayLength,
              typedFieldSchema.element,
              contextPluginName
            );
            currentOffset += 2 + arrayLength;
            break;

          case 'unknown':
            if (typedFieldSchema.parser) {
              // Use custom parser if provided
              const parserArgs: any = {
                buffer,
                offset: currentOffset,
                length: buffer.length - currentOffset,
              };

              // Pass context data if available (like scriptCount for VMAD)
              if (fieldName === 'scriptData' && result.scriptCount !== undefined) {
                parserArgs.scriptCount = result.scriptCount;
              }

              result[fieldName] = typedFieldSchema.parser(parserArgs);
              // For unknown fields with custom parsers, we need to be careful about offset advancement
              // The parser should handle its own offset management
              break;
            } else {
              // Skip unknown fields without parsers
              const unknownLength = buffer.readUInt16LE(currentOffset);
              if (currentOffset + 2 + unknownLength > buffer.length) break;
              currentOffset += 2 + unknownLength;
              break;
            }
          default:
            // Skip unsupported field types
            break;
        }
      } catch (error) {
        console.warn(`[WARN] Failed to parse field ${fieldName} in schema reference:`, error);
        break; // Stop parsing on error
      }
    }

    return result;
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
  fieldData: any[],
  schema: FieldSchema,
  decoder: BufferDecoder,
  contextPluginName?: string,
  formId?: string
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
      return decoder.parseFormId(buffer, 0, undefined, contextPluginName);

    case 'uint8':
    case 'uint16':
    case 'uint32':
    case 'float32':
      return decoder.parseNumeric(buffer, 0, schema.type, schema.parser);

    case 'struct':
      // Use the size property if available, otherwise use buffer length
      const structSize =
        'size' in schema && typeof schema.size === 'number' ? schema.size : buffer.length;
      return decoder.parseStruct(
        buffer,
        0,
        structSize,
        schema.fields,
        true,
        contextPluginName,
        formId
      );

    case 'array':
      // If multiple buffers, decode each as an element
      if (fieldData.length > 1) {
        return fieldData.map((buf) =>
          decodeField([buf], schema.element, decoder, contextPluginName, formId)
        );
      } else {
        // Fallback to current logic for single buffer
        return decoder.parseArray(buffer, 0, buffer.length, schema.element, contextPluginName);
      }

    case 'unknown':
      if (schema.parser) {
        // Use custom parser if provided
        const parserArgs: any = {
          buffer,
          offset: 0,
          length: buffer.length,
        };
        return schema.parser(parserArgs);
      } else {
        // Return raw buffer data if no parser
        return buffer.toString('base64');
      }

    default:
      return null;
  }
}

const parseGroupedFields = (
  parsedRecord: ParsedRecord,
  offset: number,
  { terminatorTag, groupSchema, virtualField, dynamicSchema }: GroupedFieldsSchema,
  decoder: BufferDecoder
): { decodedField: any; fieldCount: number } => {
  // Get context plugin name from record metadata
  const contextPluginName = parsedRecord.meta?.plugin;
  // Get formId for error reporting
  const formId = getFormIdFromRecord(parsedRecord);

  // Process the first subrecord, which is the group trigger but also sometimes a terminator
  const firstSubrecord = parsedRecord.record[offset];
  const firstSubrecordSchema = groupSchema[firstSubrecord.tag];
  const decodedFirstSubrecord = decodeField(
    [firstSubrecord.buffer],
    firstSubrecordSchema,
    decoder,
    contextPluginName,
    formId
  );

  if (parsedRecord.meta.formId === '0x0000044F' && firstSubrecord.tag === 'PNAM') {
    const buffer = createBufferFromFieldData([firstSubrecord.buffer]);
    console.log(formatFormId(buffer?.readUInt32LE(0) ?? 0), decodedFirstSubrecord);
    console.log(contextPluginName);
  }

  const decodedField = {
    [virtualField]: {
      [firstSubrecord.tag]: decodedFirstSubrecord,
    },
  };

  // If we have a dynamic schema function, use it to get the schema based on parsed data
  let currentSchema = groupSchema;
  if (dynamicSchema) {
    try {
      currentSchema = { ...groupSchema, ...dynamicSchema(decodedFirstSubrecord) };
    } catch (error) {
      console.warn(`[WARN] Failed to get dynamic schema for ${firstSubrecord.tag}:`, error);
      // Fall back to base schema
    }
  }

  let processedFields = 1;

  while (processedFields + offset < parsedRecord.record.length) {
    const subrecord = parsedRecord.record[processedFields + offset];
    // check for terminator tag
    if (subrecord.tag === terminatorTag) {
      break;
    }

    const subrecordSchema = currentSchema[subrecord.tag];
    if (!subrecordSchema) {
      console.warn(
        `[WARN] No schema found for field ${parsedRecord.meta.globalFormId} ${subrecord.tag} in grouped field`
      );
      console.log(`[DEBUG] Available schema keys:`, Object.keys(currentSchema));
      console.log(`[DEBUG] First subrecord data:`, decodedFirstSubrecord);
      processedFields++;
      continue;
    }

    const decodedSubrecord = decodeField(
      [subrecord.buffer],
      subrecordSchema,
      decoder,
      contextPluginName,
      formId
    );
    decodedField[virtualField][subrecord.tag] = decodedSubrecord;

    ++processedFields;
  }

  return {
    decodedField,
    fieldCount: processedFields,
  };
};

export function processRecordFields(
  record: ParsedRecord,
  config: BufferDecoderConfig,
  decoder: BufferDecoder
): ProcessRecordResult {
  const processedRecord = { ...record } as ParsedRecord;
  let hasDecodedFields = false;
  let recordErrors = 0;

  // Get context plugin name from record metadata
  const contextPluginName = processedRecord.meta?.plugin;
  // Get formId for error reporting
  const formId = getFormIdFromRecord(processedRecord);

  // Use indexed iterator for order-dependent processing with potential skip-ahead capability
  let i = 0;
  while (i < processedRecord.record.length) {
    const subrecord = processedRecord.record[i];
    const fieldName = subrecord.tag;
    let fieldData: any[] = []; // Ensure fieldData is always defined
    const schema = decoder.getFieldSchema(config.recordType, fieldName);

    if (!schema) {
      i++; // Skip to next record if no schema found
      continue;
    }

    let fieldCount = 1; // Default to 1 for non-grouped fields
    const decodedData: Record<string, any> = {};

    try {
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
      } else if (schema.type === 'array') {
        fieldData = [];
        let j = i;
        while (j < processedRecord.record.length && processedRecord.record[j].tag === fieldName) {
          fieldData.push(processedRecord.record[j].buffer);
          j++;
        }
        fieldCount = fieldData.length;
        if (fieldCount > 0) {
          const decodedField = decodeField(fieldData, schema, decoder, contextPluginName, formId);
          if (decodedField !== null) {
            decodedData[fieldName] = decodedField;
          }
        }
      } else {
        fieldData = [subrecord.buffer];
        const decodedField = decodeField(fieldData, schema, decoder, contextPluginName, formId);
        if (decodedField !== null) {
          decodedData[fieldName] = decodedField;
        }
      }

      if (decodedData !== null && Object.keys(decodedData).length > 0) {
        if (!processedRecord.decodedData) {
          processedRecord.decodedData = {};
        }
        processedRecord.decodedData = {
          ...processedRecord.decodedData,
          ...decodedData,
        };
        hasDecodedFields = true;
      }

      // Skip ahead by the number of fields processed (supports grouped fields and arrays)
      i += fieldCount;
    } catch (error) {
      console.error(`[ERROR] Failed to parse record for ${fieldName}:`, error);
      console.error(`[ERROR] Record EDID: ${record.meta?.type || 'unknown'}`);
      console.error(`[ERROR] Record FormID: ${formId}`);
      console.error(`[ERROR] Record type: ${config.recordType}`);
      console.error(`[ERROR] Field index: ${i}`);
      console.error(`[ERROR] Total fields in record: ${processedRecord.record.length}`);

      // Show buffer information
      const buffer = createBufferFromFieldData(fieldData);
      if (buffer) {
        console.error(`[ERROR] Buffer length: ${buffer.length}`);
      }

      errorLog(`Failed to decode field ${fieldName}:`, error);
      if (!processedRecord.decodedErrors) {
        processedRecord.decodedErrors = {};
      }
      processedRecord.decodedErrors[fieldName] = {
        error: error instanceof Error ? error.message : String(error),
        fieldPath: `record.${fieldName}`,
        details: {
          bufferLength:
            fieldData && fieldData.length > 0 ? createBufferFromFieldData(fieldData)?.length : 0,
          recordType: config.recordType,
          formId: formId,
        },
      };
      recordErrors++;
      i++;
    }
  }

  return { processedRecord, hasDecodedFields, recordErrors };
}

export function createBufferDecoderProcessor(config: BufferDecoderConfig): Processor {
  // Use multithreaded version if enabled
  if (config.multithreaded) {
    console.log(`[INFO] Using multithreaded buffer decoder processor`);
    return createMultithreadedBufferDecoderProcessor(config);
  }

  // Use single-threaded version
  console.log(`[INFO] Using single-threaded buffer decoder processor`);
  const decoder = new BufferDecoder();
  let stats = {
    recordsProcessed: 0,
    recordsDecoded: 0,
    errors: 0,
    totalFields: 0,
    skippedFields: 0,
  };

  return {
    async transform(records: JsonArray): Promise<JsonArray> {
      const startTime = Date.now();
      const totalRecords = records.length;
      const logInterval = Math.max(1, Math.floor(totalRecords / 10));

      // Load plugin metadata if requested
      if (config.loadPluginMetadata) {
        console.log(`[DEBUG] Loading plugin metadata for FormID resolution...`);
        await decoder.loadPluginMetadata(config.inputFilePath, config.pluginMetadataPath);
      }

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
            )}%) - FormID: ${getFormIdFromRecord(record)}`
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
          errorLog(`Failed to process record ${getFormIdFromRecord(record)}:`, error);
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

      return processedRecords;
    },

    getStats: () => stats,
  };
}

export function createMultithreadedBufferDecoderProcessor(config: BufferDecoderConfig): Processor {
  let stats = {
    recordsProcessed: 0,
    recordsDecoded: 0,
    errors: 0,
    totalFields: 0,
    skippedFields: 0,
  };

  return {
    async transform(records: JsonArray): Promise<JsonArray> {
      const startTime = Date.now();
      const totalRecords = records.length;

      // Determine number of worker threads
      const cpuCores = os.cpus().length;
      const defaultMaxWorkers = Math.min(cpuCores, 8);
      const maxWorkers = config.maxWorkers || defaultMaxWorkers;
      const numWorkers = Math.min(maxWorkers, Math.max(4, Math.floor(totalRecords / 500)));

      console.log(`[INFO] Starting multithreaded buffer decoder with ${numWorkers} workers`);
      console.log(`[INFO] Processing ${totalRecords} records`);
      console.log(`[INFO] CPU cores available: ${cpuCores}, Max workers: ${maxWorkers}`);

      // Calculate batch sizes
      const batchSize = Math.ceil(totalRecords / numWorkers);
      const workers: Worker[] = [];
      const workerPromises: Promise<ParsedRecord[]>[] = [];

      // Create and initialize workers
      for (let i = 0; i < numWorkers; i++) {
        const startIndex = i * batchSize;
        const endIndex = Math.min(startIndex + batchSize, totalRecords);

        if (startIndex >= totalRecords) break;

        const worker = new Worker(
          path.join(
            __dirname,
            '../../../../parsing-pipeline/dist/parsing-pipeline/src/processors/buffer-decoder/parser.js'
          ),
          {
            workerData: { config },
          }
        );

        console.log(`[DEBUG] Created worker ${i + 1} with PID: ${worker.threadId}`);

        const workerPromise = new Promise<ParsedRecord[]>((resolve, reject) => {
          let workerStats = {
            recordsProcessed: 0,
            recordsDecoded: 0,
            errors: 0,
          };

          // Add timeout to detect stalled workers
          const timeout = setTimeout(() => {
            console.error(`[ERROR] Worker ${i + 1} timed out after 30 seconds`);
            reject(new Error(`Worker ${i + 1} timed out`));
          }, 30000);

          worker.on('message', (message: any) => {
            console.log(`[DEBUG] Worker ${i + 1} (PID: ${worker.threadId}) message:`, message.type);
            switch (message.type) {
              case 'ready':
                console.log(
                  `[DEBUG] Worker ${i + 1} is ready, sending batch of ${endIndex - startIndex} records`
                );
                clearTimeout(timeout);
                // Worker is ready, send it the batch to process
                worker.postMessage({
                  type: 'process',
                  data: {
                    records: records.slice(startIndex, endIndex),
                    config,
                    startIndex,
                    endIndex,
                  },
                });
                break;

              case 'progress':
                // Log progress from worker
                console.log(
                  `[WORKER ${i + 1}] Progress: ${message.progress.current}/${message.progress.total} - ${message.progress.formId}`
                );
                break;

              case 'result':
                console.log(
                  `[DEBUG] Worker ${i + 1} completed processing ${message.data.processedRecords.length} records`
                );
                clearTimeout(timeout);
                // Worker completed processing
                workerStats = message.data.stats;
                stats.recordsProcessed += workerStats.recordsProcessed;
                stats.recordsDecoded += workerStats.recordsDecoded;
                stats.errors += workerStats.errors;
                resolve(message.data.processedRecords);
                break;

              case 'error':
                console.error(`[ERROR] Worker ${i + 1} error:`, message.error);
                clearTimeout(timeout);
                reject(new Error(`Worker ${i + 1} failed: ${message.error}`));
                break;
            }
          });

          worker.on('error', (error) => {
            console.error(`[ERROR] Worker ${i + 1} (PID: ${worker.threadId}) crashed:`, error);
            clearTimeout(timeout);
            reject(error);
          });

          worker.on('exit', (code) => {
            console.log(
              `[DEBUG] Worker ${i + 1} (PID: ${worker.threadId}) exited with code: ${code}`
            );
            clearTimeout(timeout);
            // Only treat non-zero exit codes as errors
            if (code !== 0 && code !== null) {
              console.error(`[ERROR] Worker ${i + 1} exited with code ${code}`);
              reject(new Error(`Worker ${i + 1} exited with code ${code}`));
            }
          });

          // Send init message to start worker initialization
          console.log(`[DEBUG] Sending init message to worker ${i + 1}`);
          worker.postMessage({ type: 'init' });
        });

        workers.push(worker);
        workerPromises.push(workerPromise);
      }

      try {
        // Wait for all workers to complete
        const results = await Promise.all(workerPromises);

        // Combine results in order
        const processedRecords: ParsedRecord[] = [];
        for (const result of results) {
          processedRecords.push(...result);
        }

        const duration = Date.now() - startTime;
        console.log(`===== Multithreaded Buffer Decoder Transform Complete =====`);
        console.log(`Buffer decoder completed in ${duration}ms`);
        console.log(
          `Successfully decoded ${stats.recordsDecoded}/${stats.recordsProcessed} records`
        );
        if (stats.errors > 0) {
          console.log(`Encountered ${stats.errors} errors during decoding`);
        }

        return processedRecords;
      } finally {
        // Clean up workers
        for (const worker of workers) {
          worker.terminate();
        }
      }
    },

    getStats: () => stats,
  };
}

// Worker thread detection and handling
if (parentPort) {
  console.log('[DEBUG] Worker thread starting...');
  // This file is being run as a worker thread
  const { workerData } = require('worker_threads');

  console.log('[DEBUG] Worker data received:', workerData ? 'yes' : 'no');

  let decoder: BufferDecoder;
  let config: BufferDecoderConfig;
  let currentFormId: string | undefined;

  // Initialize the worker
  const initializeWorker = async () => {
    try {
      console.log('[DEBUG] Initializing worker...');
      decoder = new BufferDecoder();
      config = workerData.config;

      console.log('[DEBUG] Config received:', config ? 'yes' : 'no');
      console.log('[DEBUG] Record type:', config?.recordType);
      console.log('[DEBUG] Load plugin metadata:', config?.loadPluginMetadata);

      // Load plugin metadata if requested
      if (config.loadPluginMetadata) {
        console.log('[DEBUG] Loading plugin metadata...');
        await decoder.loadPluginMetadata(config.inputFilePath, config.pluginMetadataPath);
        console.log('[DEBUG] Plugin metadata loaded successfully');
      }

      console.log('[DEBUG] Worker initialization complete, sending ready message');
      parentPort?.postMessage({ type: 'ready' });
    } catch (error) {
      console.error('[DEBUG] Worker initialization failed:', error);
      parentPort?.postMessage({
        type: 'error',
        error: error instanceof Error ? error.message : String(error),
      });
    }
  };

  // Process a batch of records
  const processBatch = async (records: ParsedRecord[], startIndex: number, endIndex: number) => {
    console.log(
      `[DEBUG] Starting batch processing: ${records.length} records (${startIndex}-${endIndex})`
    );

    const stats = {
      recordsProcessed: 0,
      recordsDecoded: 0,
      errors: 0,
    };

    const processedRecords: ParsedRecord[] = [];
    const totalRecords = endIndex - startIndex;
    const logInterval = Math.max(1, Math.floor(totalRecords / 10));

    for (let i = 0; i < records.length; i++) {
      const recordIndex = startIndex + i;
      const record = records[i];
      currentFormId = getFormIdFromRecord(record);

      // Send progress updates
      if (i % logInterval === 0) {
        console.log(`[DEBUG] Processing record ${i + 1}/${records.length} - ${currentFormId}`);
        parentPort?.postMessage({
          type: 'progress',
          progress: {
            current: i + 1,
            total: totalRecords,
            formId: currentFormId,
          },
        });
      }

      try {
        if (!record.meta || !record.record || !record.header) {
          processedRecords.push(record);
          stats.recordsProcessed++;
          continue;
        }

        const { processedRecord, hasDecodedFields, recordErrors } = processRecordFields(
          record,
          config,
          decoder
        );

        processedRecords.push(processedRecord);
        stats.recordsProcessed++;

        if (hasDecodedFields) {
          stats.recordsDecoded++;
        }
        if (recordErrors > 0) {
          stats.errors++;
        }
      } catch (error) {
        console.error(`[ERROR] Failed to process record ${currentFormId}:`, error);
        stats.errors++;
        processedRecords.push(record);
      }
    }

    console.log(`[DEBUG] Batch processing complete. Stats:`, stats);
    return {
      type: 'result',
      data: {
        processedRecords,
        stats,
        startIndex,
        endIndex,
      },
    };
  };

  // Handle messages from the main thread
  parentPort?.on('message', async (message: any) => {
    console.log(`[DEBUG] Worker received message:`, message.type);
    try {
      switch (message.type) {
        case 'init':
          console.log('[DEBUG] Received init message, starting initialization');
          await initializeWorker();
          break;

        case 'process':
          console.log('[DEBUG] Received process message, starting batch processing');
          if (!message.data) {
            throw new Error('No data provided for processing');
          }

          const result = await processBatch(
            message.data.records,
            message.data.startIndex,
            message.data.endIndex
          );

          console.log('[DEBUG] Sending result back to main thread');
          parentPort?.postMessage(result);

          // Exit cleanly after sending result
          console.log('[DEBUG] Worker completed successfully, exiting');
          process.exit(0);
          break;

        default:
          throw new Error(`Unknown message type: ${message.type}`);
      }
    } catch (error) {
      console.error('[DEBUG] Worker error:', error);
      parentPort?.postMessage({
        type: 'error',
        error: `${error instanceof Error ? error.message : String(error)} (FormID: ${currentFormId || 'unknown'})`,
      });
    }
  });

  // Handle worker errors
  process.on('uncaughtException', (error) => {
    console.error('[DEBUG] Worker uncaught exception:', error);
    parentPort?.postMessage({
      type: 'error',
      error: `${error.message} (FormID: ${currentFormId || 'unknown'})`,
    });
  });

  process.on('unhandledRejection', (reason) => {
    console.error('[DEBUG] Worker unhandled rejection:', reason);
    parentPort?.postMessage({
      type: 'error',
      error: `${reason instanceof Error ? reason.message : String(reason)} (FormID: ${currentFormId || 'unknown'})`,
    });
  });
}
