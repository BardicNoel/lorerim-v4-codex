import { RecordSpecificSchemas } from '../schemaTypes';
import { createSchema } from '../createSchema';

export const refrSchema: RecordSpecificSchemas = createSchema('REFR', {
  // NAME - Base object reference (required)
  NAME: {
    type: 'formid',
  },

  // DATA - Position/Rotation data (required)
  DATA: {
    type: 'struct',
    fields: [
      { type: 'float32' }, // Position X
      { type: 'float32' }, // Position Y
      { type: 'float32' }, // Position Z
      { type: 'float32' }, // Rotation X
      { type: 'float32' }, // Rotation Y
      { type: 'float32' }, // Rotation Z
      { type: 'float32' }, // Scale
    ],
  },

  // VMAD - Script data
  VMAD: {
    type: 'unknown', // Complex script data structure
  },

  // XMBO - Bounds
  XMBO: {
    type: 'struct',
    fields: [
      { type: 'float32' }, // X
      { type: 'float32' }, // Y
      { type: 'float32' }, // Z
    ],
  },

  // XPRM - Primitive
  XPRM: {
    type: 'struct',
    fields: [
      { type: 'float32' }, // Bounds X
      { type: 'float32' }, // Bounds Y
      { type: 'float32' }, // Bounds Z
      { type: 'float32' }, // Color R
      { type: 'float32' }, // Color G
      { type: 'float32' }, // Color B
      { type: 'float32' }, // Unknown
      { type: 'uint32' }, // Type (1=Box, 2=Sphere, 3=Portal Box, 4=Unknown)
    ],
  },

  // XPOD - Portal destination
  XPOD: {
    type: 'array',
    element: { type: 'formid' },
  },

  // XRMR - Reference marker
  XRMR: {
    type: 'struct',
    fields: [
      { type: 'uint8' }, // Count of following XLRM
      { type: 'uint8' }, // Flags
      { type: 'uint8' }, // Unknown
      { type: 'uint8' }, // Unknown
    ],
  },

  // LNAM - Lighting template
  LNAM: {
    type: 'formid',
  },

  // INAM - Image space
  INAM: {
    type: 'formid',
  },

  // XLRM - Location room marker
  XLRM: {
    type: 'formid',
  },

  // XEMI - Emitted light
  XEMI: {
    type: 'formid',
  },

  // XLIG - Light data
  XLIG: {
    type: 'struct',
    fields: [
      { type: 'float32' }, // FOV
      { type: 'float32' }, // Fade
      { type: 'float32' }, // End Distance Cap
      { type: 'float32' }, // Shadow Depth Bias
      { type: 'uint32' }, // Unknown (Dawnguard/Hearthfire)
    ],
  },

  // XALP - Alpha cutoff
  XALP: {
    type: 'struct',
    fields: [
      { type: 'uint8' }, // Current Alpha Cutoff
      { type: 'uint8' }, // Default Alpha Cutoff
    ],
  },

  // XTEL - Door teleport
  XTEL: {
    type: 'struct',
    fields: [
      { type: 'formid' }, // Destination door
      { type: 'float32' }, // X pos
      { type: 'float32' }, // Y pos
      { type: 'float32' }, // Z pos
      { type: 'float32' }, // X rot
      { type: 'float32' }, // Y rot
      { type: 'float32' }, // Z rot
      { type: 'uint32' }, // Flags
    ],
  },

  // XSCL - Scale
  XSCL: {
    type: 'float32',
  },

  // XLOC - Lock data
  XLOC: {
    type: 'struct',
    fields: [
      { type: 'uint8' }, // Level
      { type: 'uint8' }, // Unknown
      { type: 'uint8' }, // Unknown
      { type: 'uint8' }, // Unknown
      { type: 'formid' }, // Key
      { type: 'uint8' }, // Flags
      { type: 'uint8' }, // Unknown
      { type: 'uint8' }, // Unknown
      { type: 'uint8' }, // Unknown
      { type: 'uint8' }, // Unknown
      { type: 'uint8' }, // Unknown
      { type: 'uint8' }, // Unknown
      { type: 'uint8' }, // Unknown
      { type: 'uint8' }, // Unknown
      { type: 'uint8' }, // Unknown
    ],
  },

  // XLRT - Location ref type
  XLRT: {
    type: 'formid',
  },

  // XOWN - Owner
  XOWN: {
    type: 'formid',
  },

  // XCNT - Item count
  XCNT: {
    type: 'uint32',
  },

  // TNAM - Map marker type
  TNAM: {
    type: 'uint16',
  },

  // FNAM - Map flags
  FNAM: {
    type: 'uint8',
  },

  // FULL - Map marker name
  FULL: {
    type: 'string',
    encoding: 'utf8',
  },
});
