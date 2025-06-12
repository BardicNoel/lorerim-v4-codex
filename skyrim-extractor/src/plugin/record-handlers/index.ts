import { RecordMeta } from '../record-meta.js';
import { parseARMO, ARMORecord } from './ARMO.js';
import { parsePERK, PERKRecord } from './PERK.js';
import { parseCOBJ, COBJRecord } from './COBJ.js';
import { parseLVLI, LVLIRecord } from './LVLI.js';
import { parseNPC_, NPC_Record } from './NPC_.js';
import { parseRACE, RACERecord } from './RACE.js';
import { parseBOOK, BOOKRecord } from './BOOK.js';
import { parseGRUP, GRUPRecord } from './GRUP.js';

// Union type of all possible record types
export type RecordType = 
  | 'ARMO' | 'PERK' | 'COBJ' | 'LVLI' 
  | 'NPC_' | 'RACE' | 'BOOK' | 'GRUP';

// Union type of all possible record data
export type RecordData = 
  | ARMORecord | PERKRecord | COBJRecord | LVLIRecord 
  | NPC_Record | RACERecord | BOOKRecord | GRUPRecord;

// Type for the parse function
type ParseFunction<T extends RecordData> = (
  buffer: Buffer,
  meta: Omit<RecordMeta<T>, 'parsed'>
) => RecordMeta<T>;

// Registry mapping record types to their parse functions
const recordHandlers: Record<RecordType, ParseFunction<any>> = {
  ARMO: parseARMO,
  PERK: parsePERK,
  COBJ: parseCOBJ,
  LVLI: parseLVLI,
  'NPC_': parseNPC_,
  RACE: parseRACE,
  BOOK: parseBOOK,
  GRUP: parseGRUP,
};

/**
 * Parse a record using the appropriate handler
 * @param recordType The type of record to parse
 * @param buffer The record data buffer
 * @param meta The record metadata
 * @returns The parsed record with metadata
 */
export function parseRecord(
  recordType: RecordType,
  buffer: Buffer,
  meta: Omit<RecordMeta<RecordData>, 'parsed'>
): RecordMeta<RecordData> {
  const handler = recordHandlers[recordType];
  if (!handler) {
    throw new Error(`No handler found for record type: ${recordType}`);
  }
  return handler(buffer, meta);
}

/**
 * Check if a record type has a handler
 * @param recordType The type of record to check
 * @returns True if a handler exists for this record type
 */
export function hasHandler(recordType: string): recordType is RecordType {
  return recordType in recordHandlers;
} 