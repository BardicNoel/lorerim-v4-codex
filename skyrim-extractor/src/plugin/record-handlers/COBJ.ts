import { z } from 'zod';
import { RecordMeta } from '../record-meta.js';
import { readString } from '../../utils/buffer-helpers.js';

// Define the schema for COBJ records based on the UESP definitions
export const COBJ_SCHEMA = z.object({
  EDID: z.string().describe('Editor ID'),
  CNAM: z.number().optional().describe('Workbench keyword'),
  BNAM: z.number().optional().describe('Crafting station keyword'),
  FNAM: z.number().optional().describe('Created item'),
  INTV: z.number().optional().describe('Creation count'),
  NAM1: z.number().optional().describe('First required item'),
  NAM2: z.number().optional().describe('Second required item')
});

export type COBJRecord = z.infer<typeof COBJ_SCHEMA>;

export function parseCOBJ(buffer: Buffer, meta: Omit<RecordMeta<COBJRecord>, 'parsed'>): RecordMeta<COBJRecord> {
  const result: Partial<COBJRecord> = {};
  let offset = 0;

  while (offset < buffer.length) {
    const type = buffer.toString('ascii', offset, offset + 4);
    const size = buffer.readUInt16LE(offset + 4);
    const data = buffer.slice(offset + 6, offset + 6 + size);

    switch (type) {
      case 'EDID':
        result.EDID = readString(data, 0, size);
        break;
      case 'CNAM':
        if (size >= 4) {
          result.CNAM = data.readUInt32LE(0);
        }
        break;
      case 'BNAM':
        if (size >= 4) {
          result.BNAM = data.readUInt32LE(0);
        }
        break;
      case 'FNAM':
        if (size >= 4) {
          result.FNAM = data.readUInt32LE(0);
        }
        break;
      case 'INTV':
        if (size >= 4) {
          result.INTV = data.readUInt32LE(0);
        }
        break;
      case 'NAM1':
        if (size >= 4) {
          result.NAM1 = data.readUInt32LE(0);
        }
        break;
      case 'NAM2':
        if (size >= 4) {
          result.NAM2 = data.readUInt32LE(0);
        }
        break;
    }

    offset += 6 + size;
  }

  return {
    ...meta,
    parsed: COBJ_SCHEMA.parse(result)
  };
} 