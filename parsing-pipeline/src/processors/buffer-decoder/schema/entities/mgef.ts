import { flagParserGenerator, mapParserGenerator } from '../generics';
import { RecordSpecificSchemas } from '../schemaTypes';
import { createSchema } from '../createSchema';
import { actorValueMap } from '@lorerim/platform-types';
import { CTDA_ARRAY_SCHEMA } from '../sharedFields/ctdaSchema';

export const MGEFFlags: Record<number, string> = {
  0x00000001: 'Hostile',
  0x00000002: 'Recover',
  0x00000004: 'Detrimental',
  0x00000008: 'Snap to Navmesh',
  0x00000010: 'No Hit Event',
  0x00000100: 'Dispel Effects',
  0x00000200: 'No Duration',
  0x00000400: 'No Magnitude',
  0x00000800: 'No Area',
  0x00001000: 'FX Persist',
  0x00004000: 'Gory Visual',
  0x00008000: 'Hide in UI',
  0x00020000: 'No Recast',
  0x00200000: 'Power Affects Magnitude',
  0x00400000: 'Power Affects Duration',
  0x04000000: 'Painless',
  0x08000000: 'No Hit Effect',
  0x10000000: 'No Death Dispel',
  0x40000000: '?',
  0x80000000: '?',
};

export const mgefSchema: RecordSpecificSchemas = createSchema('MGEF', {
  // Editor ID
  EDID: { type: 'string', encoding: 'utf8' },
  // VMAD (Papyrus script data) - optional, variable binary
  VMAD: { type: 'unknown' },
  // Full name - optional
  FULL: { type: 'string', encoding: 'utf8' },
  // Menu Display Object - optional
  MDOB: { type: 'formid' },
  // Keyword count - optional
  KSIZ: { type: 'uint32' },
  // Keywords - optional
  KWDA: { type: 'array', element: { type: 'formid' } },
  DATA: {
    type: 'struct',
    fields: [
      { name: 'flags', type: 'uint32', parser: flagParserGenerator(MGEFFlags) },
      { name: 'baseCost', type: 'float32' },
      { name: 'relatedID', type: 'formid' },
      { name: 'skill', type: 'int32' },
      { name: 'resistanceAV', type: 'uint32', parser: mapParserGenerator(actorValueMap) },
      { name: 'unknown1', type: 'uint32' },
      { name: 'castingLight', type: 'formid' },
      { name: 'taperWeight', type: 'float32' },
      { name: 'hitShader', type: 'formid' },
      { name: 'enchantShader', type: 'formid' },
      { name: 'skillLevel', type: 'uint32' },
      { name: 'area', type: 'uint32' },
      { name: 'castingTime', type: 'float32' },
      { name: 'taperCurve', type: 'float32' },
      { name: 'taperDuration', type: 'float32' },
      { name: 'secondAVWeight', type: 'float32' },
      { name: 'effectType', type: 'uint32' },
      { name: 'primaryAV', type: 'int32', parser: mapParserGenerator(actorValueMap) },
      { name: 'projectileID', type: 'formid' },
      { name: 'explosionID', type: 'formid' },
      { name: 'castType', type: 'uint32' },
      { name: 'deliveryType', type: 'uint32' },
      { name: 'secondAV', type: 'int32' },
      { name: 'castingArt', type: 'formid' },
      { name: 'hitEffectArt', type: 'formid' },
      { name: 'impactDataID', type: 'formid' },
      { name: 'skillUsageMult', type: 'float32' },
      { name: 'dualCastID', type: 'formid' },
      { name: 'dualCastScale', type: 'float32' },
      { name: 'enchantArtID', type: 'formid' },
      { name: 'nullData1', type: 'uint32' },
      { name: 'nullData2', type: 'uint32' },
      { name: 'equipAbility', type: 'formid' },
      { name: 'imageSpaceModID', type: 'formid' },
      { name: 'perkID', type: 'formid' },
      { name: 'soundVolume', type: 'uint32' },
      { name: 'scriptAIDataScore', type: 'float32' },
      { name: 'scriptAIDataDelayTime', type: 'float32' },
    ],
  },
  // Counter Effects - optional
  ESCE: { type: 'formid' },
  // Sound Data - optional, variable binary
  SNDD: { type: 'unknown' },
  // Description - optional
  DNAM: { type: 'string', encoding: 'utf8' },
  // Conditions (array of CTDA)
  CTDA: CTDA_ARRAY_SCHEMA,
});
