import { RecordSpecificSchemas } from '../schemaTypes';
import { createSchema } from '../createSchema';
import { CTDA_ARRAY_SCHEMA } from '../sharedFields/ctdaSchema';

export const mesgSchema: RecordSpecificSchemas = createSchema('MESG', {
  // Icon Text - ManyAllowed FixedSize
  ITXT: {
    type: 'string',
    encoding: 'utf8',
  },
  // Quest Name - FixedSize
  QNAM: {
    type: 'formid',
  },
  // Icon Name - One/Record Required FixedSize
  INAM: {
    type: 'formid',
  },
  // Topic Name - FixedSize
  TNAM: {
    type: 'formid',
  },
  // Conditions (array of CTDA) - ManyAllowed
  CTDA: CTDA_ARRAY_SCHEMA,
});
