import { z } from 'zod';
import { RecordMeta } from '../record-meta.js';
import { readString } from '../../utils/buffer-helpers.js';

// Define the schema for LVLI records based on the UESP definitions
export const LVLI_SCHEMA = z.object({
  EDID: z.string().describe('Editor ID'),
  LVLD: z.number().optional().describe('List flags'),
  LVLF: z.number().optional().describe('Flags'),
  LLCT: z.number().optional().describe('List count'),
  CNTO: z.array(z.object({
    item: z.number(),
    level: z.number(),
    count: z.number()
  })).optional().describe('List item entries')
});

export type LVLIRecord = z.infer<typeof LVLI_SCHEMA>;

export function parseLVLI(buffer: Buffer, meta: Omit<RecordMeta<LVLIRecord>, 'parsed'>): RecordMeta<LVLIRecord> {
  const result: Partial<LVLIRecord> = {};
  let offset = 0;

  while (offset < buffer.length) {
    const type = buffer.toString('ascii', offset, offset + 4);
    const size = buffer.readUInt16LE(offset + 4);
    const data = buffer.slice(offset + 6, offset + 6 + size);

    switch (type) {
      case 'EDID':
        result.EDID = readString(data, 0, size);
        break;
      case 'LVLD':
        if (size >= 1) {
          result.LVLD = data.readUInt8(0);
        }
        break;
      case 'LVLF':
        if (size >= 1) {
          result.LVLF = data.readUInt8(0);
        }
        break;
      case 'LLCT':
        if (size >= 4) {
          result.LLCT = data.readUInt32LE(0);
        }
        break;
      case 'CNTO':
        if (!result.CNTO) {
          result.CNTO = [];
        }
        if (size >= 12) {
          result.CNTO.push({
            item: data.readUInt32LE(0),
            level: data.readUInt32LE(4),
            count: data.readUInt32LE(8)
          });
        }
        break;
    }

    offset += 6 + size;
  }

  return {
    ...meta,
    parsed: LVLI_SCHEMA.parse(result)
  };
} 