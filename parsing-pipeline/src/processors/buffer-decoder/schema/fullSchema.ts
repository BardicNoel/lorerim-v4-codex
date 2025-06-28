import { RecordSpecificSchemas } from './schemaTypes';
import { mgefSchema } from './entities/mgef';
import { spelSchema } from './entities/spel';
import { perkSchema } from './entities/perk';
import { avifSchema } from './entities/avif';
import { questSchema } from './entities/qust';
import { flstSchema } from './entities/flst';
import { kywdSchema } from './entities/kywd';
import { globSchema } from './entities/glob';
import { mesgSchema } from './entities/mesg';
import { weapSchema } from './entities/weap';
import { enchSchema } from './entities/ench';

// Record-specific schemas that use common fields and shared fragments
export const recordSpecificSchemas: RecordSpecificSchemas = {
  ...mgefSchema,
  ...spelSchema,
  ...perkSchema,
  ...avifSchema,
  ...questSchema,
  ...flstSchema,
  ...kywdSchema,
  ...globSchema,
  ...mesgSchema,
  ...weapSchema,
  ...enchSchema,
};
