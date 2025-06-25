import { RecordSpecificSchemas } from '../schemaTypes';
import { createSchema } from '../createSchema';

export const flstSchema: RecordSpecificSchemas = createSchema('FLST', {
  // Form List Objects - array of formids
  LNAM: {
    type: 'array',
    element: { type: 'formid' },
  },
});
