import { z } from 'zod';
import { RecordMeta } from '../record-meta.js';
import { readString } from '../../utils/buffer-helpers.js';

// Define the schema for PERK records based on the UESP definitions
export const PERK_SCHEMA = z.object({
  EDID: z.string().describe('Editor ID'),
  FULL: z.string().optional().describe('Perk name'),
  DESC: z.string().optional().describe('Perk description'),
  DATA: z.object({
    trait: z.number(),
    minLevel: z.number(),
    numRanks: z.number(),
    playable: z.number(),
    hidden: z.number()
  }).optional().describe('Perk data block'),
  PRKE: z.array(z.object({
    rank: z.number(),
    priority: z.number(),
    condition: z.number()
  })).optional().describe('Perk entry data')
});

export type PERKRecord = z.infer<typeof PERK_SCHEMA>;

export function parsePERK(buffer: Buffer, meta: Omit<RecordMeta<PERKRecord>, 'parsed'>): RecordMeta<PERKRecord> {
  const result: Partial<PERKRecord> = {};
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
        if (size >= 5) {
          result.DATA = {
            trait: data.readUInt8(0),
            minLevel: data.readUInt8(1),
            numRanks: data.readUInt8(2),
            playable: data.readUInt8(3),
            hidden: data.readUInt8(4)
          };
        }
        break;
      case 'PRKE':
        if (!result.PRKE) {
          result.PRKE = [];
        }
        if (size >= 3) {
          result.PRKE.push({
            rank: data.readUInt8(0),
            priority: data.readUInt8(1),
            condition: data.readUInt8(2)
          });
        }
        break;
    }

    offset += 6 + size;
  }

  return {
    ...meta,
    parsed: PERK_SCHEMA.parse(result)
  };
} 