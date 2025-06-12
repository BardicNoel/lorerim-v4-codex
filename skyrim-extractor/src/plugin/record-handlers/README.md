# Record Handlers

Each file in this directory should export:
- A Zod schema for the record type
- A `parse<RecordType>` function that takes a Buffer and returns a `RecordMeta<T>`

Example:
```ts
import { z } from 'zod';
import { RecordMeta } from '../record-meta';

export const ARMO_SCHEMA = z.object({ /* ... */ });
export type ARMORecord = z.infer<typeof ARMO_SCHEMA>;

export function parseARMO(buffer: Buffer, meta: Omit<RecordMeta<ARMORecord>, 'parsed'>): RecordMeta<ARMORecord> {
  // ...parse logic...
  return { ...meta, parsed: ARMO_SCHEMA.parse({/*...*/}) };
} 