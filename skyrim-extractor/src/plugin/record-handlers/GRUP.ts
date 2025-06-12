import { z } from 'zod';
import { RecordMeta } from '../record-meta.js';
import { readString } from '../../utils/buffer-helpers.js';

// Define the schema for GRUP records based on the UESP definitions
export const GRUP_SCHEMA = z.object({
  GroupType: z.number().optional().describe('Type of group (0=top-level, 1=interior, etc.)'),
  Timestamp: z.number().optional().describe('Timestamp of the group'),
  VersionControl: z.number().optional().describe('Version control info'),
  Label: z.string().optional().describe('Label for top-level groups'),
  Records: z.array(z.any()).describe('Array of records in this group')
});

export type GRUPRecord = z.infer<typeof GRUP_SCHEMA>;

export function parseGRUP(buffer: Buffer, meta: any) {
  const result: any = {
    Records: []
  };

  let offset = 0;

  // Read group header if enough data
  if (buffer.length >= 8) {
    result.GroupType = buffer.readUInt32LE(offset);
    offset += 4;
    result.Timestamp = buffer.readUInt16LE(offset);
    offset += 2;
    result.VersionControl = buffer.readUInt32LE(offset);
    offset += 4;

    // For top-level groups (type 0), read the label
    if (result.GroupType === 0 && buffer.length >= offset + 2) {
      const labelSize = buffer.readUInt16LE(offset);
      offset += 2;
      if (buffer.length >= offset + labelSize) {
        result.Label = buffer.toString('ascii', offset, offset + labelSize);
      }
    }
  }

  return { parsed: GRUP_SCHEMA.parse(result) };
} 