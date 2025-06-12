import { z } from 'zod';
import { RecordMeta } from '../record-meta.js';
import { readString } from '../../utils/buffer-helpers.js';

// Define the schema for RACE records based on the UESP definitions
export const RACE_SCHEMA = z.object({
  EDID: z.string().describe('Editor ID'),
  FULL: z.string().optional().describe('Race name'),
  DATA: z.object({
    flags: z.number(),
    maleHeight: z.number(),
    femaleHeight: z.number(),
    maleWeight: z.number(),
    femaleWeight: z.number(),
    startingHealth: z.number(),
    startingMagicka: z.number(),
    startingStamina: z.number(),
    baseCarryWeight: z.number(),
    baseMass: z.number(),
    accelerationRate: z.number(),
    decelerationRate: z.number(),
    size: z.number(),
    headBipedObject: z.number(),
    hairBipedObject: z.number(),
    injuredHealthPercent: z.number(),
    shieldBipedObject: z.number(),
    healthRegen: z.number(),
    magickaRegen: z.number(),
    staminaRegen: z.number(),
    unarmedDamage: z.number(),
    unarmedReach: z.number(),
    bodyBipedObject: z.number(),
    aimAngleTolerance: z.number(),
    angularAccelerationRate: z.number(),
    angularTolerance: z.number(),
    flags2: z.number()
  }).optional().describe('Race data flags and settings'),
  SPLO: z.array(z.number()).optional().describe('Spells the race knows'),
  DNAM: z.object({
    maleHeight: z.number(),
    femaleHeight: z.number(),
    maleWeight: z.number(),
    femaleWeight: z.number()
  }).optional().describe('Attributes (height, weight, etc.)')
});

export type RACERecord = z.infer<typeof RACE_SCHEMA>;

export function parseRACE(buffer: Buffer, meta: Omit<RecordMeta<RACERecord>, 'parsed'>): RecordMeta<RACERecord> {
  const result: Partial<RACERecord> = {};
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
      case 'DATA':
        if (size >= 80) {
          result.DATA = {
            flags: data.readUInt32LE(0),
            maleHeight: data.readFloatLE(4),
            femaleHeight: data.readFloatLE(8),
            maleWeight: data.readFloatLE(12),
            femaleWeight: data.readFloatLE(16),
            startingHealth: data.readUInt32LE(20),
            startingMagicka: data.readUInt32LE(24),
            startingStamina: data.readUInt32LE(28),
            baseCarryWeight: data.readFloatLE(32),
            baseMass: data.readFloatLE(36),
            accelerationRate: data.readFloatLE(40),
            decelerationRate: data.readFloatLE(44),
            size: data.readUInt32LE(48),
            headBipedObject: data.readUInt32LE(52),
            hairBipedObject: data.readUInt32LE(56),
            injuredHealthPercent: data.readFloatLE(60),
            shieldBipedObject: data.readUInt32LE(64),
            healthRegen: data.readFloatLE(68),
            magickaRegen: data.readFloatLE(72),
            staminaRegen: data.readFloatLE(76),
            unarmedDamage: data.readFloatLE(80),
            unarmedReach: data.readFloatLE(84),
            bodyBipedObject: data.readUInt32LE(88),
            aimAngleTolerance: data.readFloatLE(92),
            angularAccelerationRate: data.readFloatLE(96),
            angularTolerance: data.readFloatLE(100),
            flags2: data.readUInt32LE(104)
          };
        }
        break;
      case 'SPLO':
        if (!result.SPLO) {
          result.SPLO = [];
        }
        if (size >= 4) {
          result.SPLO.push(data.readUInt32LE(0));
        }
        break;
      case 'DNAM':
        if (size >= 16) {
          result.DNAM = {
            maleHeight: data.readFloatLE(0),
            femaleHeight: data.readFloatLE(4),
            maleWeight: data.readFloatLE(8),
            femaleWeight: data.readFloatLE(12)
          };
        }
        break;
    }

    offset += 6 + size;
  }

  return {
    ...meta,
    parsed: RACE_SCHEMA.parse(result)
  };
} 