import { RecordSchema, SharedFields, RecordSpecificSchemas } from './schemaTypes';
import { mgefSchema } from './entities/mgef';
import { spelSchema } from './entities/spel';
import { perkSchema } from './entities/perk';

// Record-specific schemas that use common fields and shared fragments
export const recordSpecificSchemas: RecordSpecificSchemas = {
  ...mgefSchema,
  ...spelSchema,
  ...perkSchema,
};
