import { RecordSpecificSchemas } from '../schemaTypes';
import { createSchema } from '../createSchema';

export const kywdSchema: RecordSpecificSchemas = createSchema('KYWD', {
  // Editor ID - Max 0x200 bytes, including null terminator
  EDID: {
    type: 'string',
    encoding: 'utf8',
  },
  // Color - Used to identify keywords in the editor (RGB format)
  CNAM: {
    type: 'struct',
    fields: [
      { name: 'red', type: 'uint8' },
      { name: 'green', type: 'uint8' },
      { name: 'blue', type: 'uint8' },
    ],
  },
});
