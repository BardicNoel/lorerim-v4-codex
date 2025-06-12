import { z } from 'zod';
import { RecordMeta } from '../record-meta.js';

export const STUB_SCHEMA = z.object({
  exampleField: z.string(),
});
export type StubRecord = z.infer<typeof STUB_SCHEMA>;

export function parseStub(
  buffer: Buffer,
  meta: Omit<RecordMeta<StubRecord>, 'parsed'>
): RecordMeta<StubRecord> {
  // Stub parsing logic
  return {
    ...meta,
    parsed: STUB_SCHEMA.parse({ exampleField: 'stub' }),
  };
} 