import { RecordSpecificSchemas } from './schemaTypes';
import { mgefSchema } from './entities/mgef';
import { spelSchema } from './entities/spel';
import { perkSchema } from './entities/perk';
import { avifSchema } from './entities/avif';
import { questSchema } from './entities/qust';
import { flstSchema } from './entities/flst';
import { kywdSchema } from './entities/kywd';

// Record-specific schemas that use common fields and shared fragments
export const recordSpecificSchemas: RecordSpecificSchemas = {
  ...mgefSchema,
  ...spelSchema,
  ...perkSchema,
  ...avifSchema,
  ...questSchema,
  ...flstSchema,
  ...kywdSchema,
};
