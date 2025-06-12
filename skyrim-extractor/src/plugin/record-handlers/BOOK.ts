import { z } from 'zod';
import { RecordMeta } from '../record-meta.js';
import { readString } from '../../utils/buffer-helpers.js';

// Define the schema for BOOK records based on the UESP definitions
export const BOOK_SCHEMA = z.object({
  EDID: z.string().describe('Editor ID'),
  FULL: z.string().optional().describe('Book name'),
  DESC: z.string().optional().describe('Book description'),
  DATA: z.object({
    flags: z.number(),
    value: z.number(),
    weight: z.number()
  }).optional().describe('Book data'),
  ICON: z.string().optional().describe('Icon texture path'),
  MODEL: z.string().optional().describe('Model filename'),
  YNAM: z.number().optional().describe('Pick up sound'),
  ZNAM: z.number().optional().describe('Drop sound')
});

export type BOOKRecord = z.infer<typeof BOOK_SCHEMA>;

export function parseBOOK(buffer: Buffer, meta: Omit<RecordMeta<BOOKRecord>, 'parsed'>): RecordMeta<BOOKRecord> {
  const result: Partial<BOOKRecord> = {};
  let offset = 0;

  while (offset < buffer.length) {
    const type = buffer.toString('ascii', offset, offset + 4);
    const size = buffer.readUInt16LE(offset + 4);
    const data = buffer.slice(offset + 6, offset + 6 + size);

    switch (type) {
      case 'EDID':
        result.EDID = readString(data, 0, size);
        break;
      case 'FULL':
        result.FULL = readString(data, 0, size);
        break;
      case 'DESC':
        result.DESC = readString(data, 0, size);
        break;
      case 'DATA':
        if (size >= 12) {
          result.DATA = {
            flags: data.readUInt32LE(0),
            value: data.readUInt32LE(4),
            weight: data.readFloatLE(8)
          };
        }
        break;
      case 'ICON':
        result.ICON = readString(data, 0, size);
        break;
      case 'MODL':
        result.MODEL = readString(data, 0, size);
        break;
      case 'YNAM':
        if (size >= 4) {
          result.YNAM = data.readUInt32LE(0);
        }
        break;
      case 'ZNAM':
        if (size >= 4) {
          result.ZNAM = data.readUInt32LE(0);
        }
        break;
    }

    offset += 6 + size;
  }

  return {
    ...meta,
    parsed: BOOK_SCHEMA.parse(result)
  };
} 