import { z } from 'zod';
import { RecordMeta } from '../record-meta.js';
import { readString } from '../../utils/buffer-helpers.js';

// Define the schema for NPC_ records based on the UESP definitions
export const NPC_SCHEMA = z.object({
  EDID: z.string().describe('Editor ID'),
  FULL: z.string().optional().describe('Name'),
  ACBS: z.object({
    flags: z.number(),
    baseSpellPoints: z.number(),
    fatigue: z.number(),
    barterGold: z.number(),
    level: z.number(),
    calcMin: z.number(),
    calcMax: z.number(),
    disposition: z.number(),
    unused1: z.number(),
    healthOffset: z.number(),
    magickaOffset: z.number(),
    staminaOffset: z.number(),
    attributes: z.array(z.number()).length(7)
  }).optional().describe('Actor base stats'),
  AIDT: z.object({
    aggression: z.number(),
    confidence: z.number(),
    energyLevel: z.number(),
    responsibility: z.number(),
    mood: z.number(),
    unused1: z.number(),
    unused2: z.number(),
    unused3: z.number(),
    assistance: z.number(),
    unused4: z.number(),
    unused5: z.number(),
    unused6: z.number()
  }).optional().describe('AI data'),
  DATA: z.object({
    flags: z.number(),
    unused1: z.number(),
    unused2: z.number(),
    unused3: z.number()
  }).optional().describe('Flags and base info')
});

export type NPC_Record = z.infer<typeof NPC_SCHEMA>;

export function parseNPC_(buffer: Buffer, meta: Omit<RecordMeta<NPC_Record>, 'parsed'>): RecordMeta<NPC_Record> {
  const result: Partial<NPC_Record> = {};
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
      case 'ACBS':
        if (size >= 24) {
          result.ACBS = {
            flags: data.readUInt32LE(0),
            baseSpellPoints: data.readUInt16LE(4),
            fatigue: data.readUInt16LE(6),
            barterGold: data.readUInt32LE(8),
            level: data.readUInt16LE(12),
            calcMin: data.readUInt16LE(14),
            calcMax: data.readUInt16LE(16),
            disposition: data.readUInt16LE(18),
            unused1: data.readUInt16LE(20),
            healthOffset: data.readUInt16LE(22),
            magickaOffset: data.readUInt16LE(24),
            staminaOffset: data.readUInt16LE(26),
            attributes: [
              data.readUInt8(28),
              data.readUInt8(29),
              data.readUInt8(30),
              data.readUInt8(31),
              data.readUInt8(32),
              data.readUInt8(33),
              data.readUInt8(34)
            ]
          };
        }
        break;
      case 'AIDT':
        if (size >= 12) {
          result.AIDT = {
            aggression: data.readUInt8(0),
            confidence: data.readUInt8(1),
            energyLevel: data.readUInt8(2),
            responsibility: data.readUInt8(3),
            mood: data.readUInt8(4),
            unused1: data.readUInt8(5),
            unused2: data.readUInt8(6),
            unused3: data.readUInt8(7),
            assistance: data.readUInt8(8),
            unused4: data.readUInt8(9),
            unused5: data.readUInt8(10),
            unused6: data.readUInt8(11)
          };
        }
        break;
      case 'DATA':
        if (size >= 16) {
          result.DATA = {
            flags: data.readUInt32LE(0),
            unused1: data.readUInt32LE(4),
            unused2: data.readUInt32LE(8),
            unused3: data.readUInt32LE(12)
          };
        }
        break;
    }

    offset += 6 + size;
  }

  return {
    ...meta,
    parsed: NPC_SCHEMA.parse(result)
  };
} 