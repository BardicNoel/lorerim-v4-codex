import { RecordSpecificSchemas, FieldSchema } from '../schemaTypes';
import { createSchema } from '../createSchema';

// AVIF Perk Tree Section structure
const perkTreeSection: FieldSchema = {
  type: 'struct',
  fields: [
    { name: 'perk', type: 'formid' }, // PNAM
    { name: 'flag', type: 'uint32' }, // FNAM
    { name: 'x', type: 'uint32' }, // XNAM
    { name: 'y', type: 'uint32' }, // YNAM
    { name: 'horizontal', type: 'float32' }, // HNAM
    { name: 'vertical', type: 'float32' }, // VNAM
    { name: 'skill', type: 'formid' }, // SNAM
    { name: 'connections', type: 'array', element: { type: 'uint32' } }, // CNAM (multiple possible)
    { name: 'index', type: 'uint32' }, // INAM
  ],
};

export const avifSchema: RecordSpecificSchemas = createSchema('AVIF', {
  // Abbreviation (optional)
  ANAM: { type: 'string', encoding: 'utf8' },
  // Skill category or data
  CNAM: { type: 'uint32' },
  // AV data (optional, only for skills with groupings)
  AVSK: {
    type: 'array',
    element: { type: 'float32' },
    // float[4]: Skill Use Mult, Skill Use Offset, Skill Improve Mult, Skill Improve Offset
  },
  // Perk tree (optional, array of perk tree sections)
  perkTree: {
    type: 'array',
    element: perkTreeSection,
  },
});
