import { RecordSpecificSchemas } from '../schemaTypes';
import { createSchema } from '../createSchema';

export const globSchema: RecordSpecificSchemas = createSchema('GLOB', {
  // Editor ID
  EDID: {
    type: 'string',
    encoding: 'utf8',
  },
  // Type (FNAM): 1 byte, 0=float, 1=long, 2=short
  FNAM: {
    type: 'uint8',
  },
  // Value (FLTV): 4 bytes, float32
  FLTV: {
    type: 'float32',
  },
});
