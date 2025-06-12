import { z } from 'zod';
import { RecordMeta } from '../record-meta';
import { readString } from '../../utils/buffer-helpers.js';

// Define the schema for ARMO records based on the UESP definitions
export const ARMO_SCHEMA = z.object({
  EDID: z.string().optional(), // Editor ID
  FULL: z.string().optional(), // Name
  BMDT: z.object({
    bipedFlags: z.number(),
    generalFlags: z.number(),
    unknown: z.number()
  }).optional(), // Body template data
  DNAM: z.object({
    value: z.number(),
    maxCondition: z.number(),
    weight: z.number()
  }).optional(), // Armor data
  MODL: z.string().optional(), // Model filename
  ICON: z.string().optional(), // Icon texture path
});

export type ARMORecord = z.infer<typeof ARMO_SCHEMA>;

export function parseARMO(
  buffer: Buffer, 
  meta: Omit<RecordMeta<ARMORecord>, 'parsed'>
): RecordMeta<ARMORecord> {
  let offset = 0;
  const record: Partial<ARMORecord> = {};

  while (offset < buffer.length) {
    // Read subrecord header
    const type = buffer.toString('ascii', offset, offset + 4);
    const size = buffer.readUInt16LE(offset + 4);
    offset += 6;

    // Skip if we don't have enough data for this subrecord
    if (offset + size > buffer.length) {
      break;
    }

    // Parse subrecord data based on type
    switch (type) {
      case 'EDID':
        record.EDID = readString(buffer, offset, size);
        break;
      case 'FULL':
        record.FULL = readString(buffer, offset, size);
        break;
      case 'BMDT':
        if (size >= 12) { // Check if we have enough data for BMDT
          record.BMDT = {
            bipedFlags: buffer.readUInt32LE(offset),
            generalFlags: buffer.readUInt32LE(offset + 4),
            unknown: buffer.readUInt32LE(offset + 8)
          };
        }
        break;
      case 'DNAM':
        if (size >= 12) { // Check if we have enough data for DNAM
          record.DNAM = {
            value: buffer.readUInt32LE(offset),
            maxCondition: buffer.readUInt32LE(offset + 4),
            weight: buffer.readFloatLE(offset + 8)
          };
        }
        break;
      case 'MODL':
        record.MODL = readString(buffer, offset, size);
        break;
      case 'ICON':
        record.ICON = readString(buffer, offset, size);
        break;
    }

    offset += size;
  }

  return {
    ...meta,
    parsed: ARMO_SCHEMA.parse(record)
  };
} 