import { RecordSchema, SharedFields, RecordSpecificSchemas } from './schemaTypes';
import { mgefSchema } from './entities/mgef';
import { spelSchema } from './entities/spel';
import { perkSchema } from './entities/perk';
import { createSchema } from './createSchema';

// Shared internal field layouts that can be composed into larger structs
export const sharedFields: SharedFields = {
  flags8: [{ name: 'flags', type: 'uint8' }],
  flags32: [{ name: 'flags', type: 'uint32' }],
  conditionBlock: [
    { name: 'op', type: 'uint8' },
    { name: 'value', type: 'float32' },
    { name: 'functionIndex', type: 'uint32' },
  ],
};

// Record-specific schemas that use common fields and shared fragments
export const recordSpecificSchemas: RecordSpecificSchemas = {
  ...createSchema('CELL', {
    DATA: {
      type: 'struct',
      fields: [...sharedFields.flags32, { name: 'lightLevel', type: 'uint8' }],
    },
  }),

  // ...createSchema('ALCH', {
  //   OBND: { type: 'unknown' },
  //   KSIZ: { type: 'uint32' },
  //   KWDA: { type: 'unknown' },
  //   MODL: { type: 'unknown' },
  //   ICON: { type: 'string', encoding: 'utf8' },
  //   MICO: { type: 'string', encoding: 'utf8' },
  //   YNAM: { type: 'formid' },
  //   ZNAM: { type: 'formid' },
  //   DATA: { type: 'float32' },
  //   ENIT: {
  //     type: 'struct',
  //     fields: [
  //       { name: 'value', type: 'uint32' },
  //       { name: 'flags', type: 'uint32' },
  //       { name: 'addiction', type: 'formid' },
  //       { name: 'addictionChance', type: 'uint32' },
  //       { name: 'useSound', type: 'formid' },
  //     ],
  //   },
  //   EFID: { type: 'formid' },
  //   EFIT: {
  //     type: 'struct',
  //     fields: [
  //       { name: 'magnitude', type: 'float32' },
  //       { name: 'area', type: 'uint32' },
  //       { name: 'duration', type: 'uint32' },
  //     ],
  //   },
  // }),
  ...mgefSchema,
  ...spelSchema,
  ...perkSchema,
};
