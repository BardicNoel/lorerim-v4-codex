import { promises as fs } from 'fs';
import * as E from 'fp-ts/lib/Either.js';
import * as TE from 'fp-ts/lib/TaskEither.js';
import { pipe } from 'fp-ts/lib/function.js';
import * as zlib from 'zlib';
import { promisify } from 'util';

const inflateAsync = promisify(zlib.inflate);

// Record header layout (24 bytes)
export interface RecordHeader {
  type: string;        // 4 bytes, ASCII string
  dataSize: number;    // 4 bytes, UInt32LE
  flags: number;       // 4 bytes, UInt32LE
  formId: number;      // 4 bytes, UInt32LE
  timestamp: number;   // 2 bytes, UInt16LE
  version: number;     // 2 bytes, UInt16LE
  unknown: number;     // 4 bytes, UInt32LE
}

// Subrecord format
export interface Subrecord {
  type: string;        // 4 bytes, ASCII string
  size: number;        // 2 bytes, UInt16LE
  data: Buffer;        // N bytes, payload
}

// Record structure
export interface PluginRecord {
  header: RecordHeader;
  subrecords: Subrecord[];
  type: string;        // Record type from header
  formId: number;      // Form ID from header
  offset: number;      // Record offset in file
  data: Buffer;        // Raw record data
}

// TES4 header (special record)
export interface TES4Header {
  type: string;
  version: number;
  author: string;
  description: string;
  masterFiles: string[];
  timestamp: number;
  versionControlInfo: number;
  internalVersion: number;
  loadOrder: number;  // Plugin load order
}

// Record summary
export interface RecordSummary {
  header: TES4Header;
  totalRecords: number;
  totalSubrecords: number;
  fileSize: number;
  recordCounts: Record<string, number>;
}

// Constants
const RECORD_HEADER_SIZE = 24;
const SUBRECORD_HEADER_SIZE = 6;
const COMPRESSED_FLAG = 0x00040000;

// Helper to read a string from buffer
const readString = (buffer: Buffer, offset: number, length: number): string =>
  buffer.toString('utf8', offset, offset + length).replace(/\0+$/, '');

// Helper to read a uint32 from buffer
const readUInt32 = (buffer: Buffer, offset: number): E.Either<Error, number> =>
  E.tryCatch(
    () => buffer.readUInt32LE(offset),
    (err) => new Error(`Failed to read uint32 at offset ${offset}`)
  );

// Helper to read a uint16 from buffer
const readUInt16 = (buffer: Buffer, offset: number): E.Either<Error, number> =>
  E.tryCatch(
    () => buffer.readUInt16LE(offset),
    (err) => new Error(`Failed to read uint16 at offset ${offset}`)
  );

// Read record header
const readRecordHeader = (buffer: Buffer, offset: number, verbose: boolean = false): E.Either<Error, RecordHeader> => {
  if (offset + RECORD_HEADER_SIZE > buffer.length) {
    return E.left(new Error('Not a valid Skyrim ESP/ESM file'));
  }
  const type = readString(buffer, offset, 4);
  const dataSize = buffer.readUInt32LE(offset + 4);
  const flags = buffer.readUInt32LE(offset + 8);
  const formId = buffer.readUInt32LE(offset + 12);
  const timestamp = buffer.readUInt32LE(offset + 16);
  const version = buffer.readUInt16LE(offset + 20);
  const unknown = buffer.readUInt16LE(offset + 22);
  if (verbose) {
    console.error('[RECORD HEADER]',
      `Type: ${type}, Offset: ${offset}, Size: ${dataSize}, Flags: ${flags}, FormID: ${formId}, Timestamp: ${timestamp}, Version: ${version}, Unknown: ${unknown}`,
      'First 16 bytes:', buffer.slice(offset + RECORD_HEADER_SIZE, offset + RECORD_HEADER_SIZE + 16).toString('hex')
    );
  }
  return E.right({ type, dataSize, flags, formId, timestamp, version, unknown });
};

// Read subrecord
const readSubrecord = (buffer: Buffer, offset: number, verbose: boolean = false): E.Either<Error, { subrecord: Subrecord; newOffset: number }> => {
  if (offset + 6 > buffer.length) {
    return E.left(new Error('Not a valid Skyrim ESP/ESM file'));
  }
  const type = readString(buffer, offset, 4);
  const size = buffer.readUInt16LE(offset + 4);
  if (offset + 6 + size > buffer.length) {
    return E.left(new Error('Not a valid Skyrim ESP/ESM file'));
  }
  const data = buffer.slice(offset + 6, offset + 6 + size);
  if (verbose) {
    console.error('[SUBRECORD]',
      `Type: ${type}, Offset: ${offset}, Size: ${size}`,
      'First 16 bytes:', data.slice(0, 16).toString('hex')
    );
  }
  return E.right({ subrecord: { type, size, data }, newOffset: offset + 6 + size });
};

// Decompress record data if needed
const decompressRecord = (buffer: Buffer, verbose: boolean = false, context?: { type: string; offset: number; size: number }): E.Either<Error, Buffer> =>
  E.tryCatch(
    () => {
      if (context && verbose) {
        console.error('[DECOMPRESS]',
          `Type: ${context.type}, Offset: ${context.offset}, Size: ${context.size}`,
          'First 16 bytes:', buffer.slice(0, 16).toString('hex')
        );
      }
      return zlib.inflateRawSync(buffer);
    },
    (err) => new Error(`Failed to decompress record: ${err}${context ? ` [Type: ${context.type}, Offset: ${context.offset}, Size: ${context.size}, First 16 bytes: ${buffer.slice(0, 16).toString('hex')}]` : ''}`)
  );

// Pure function: parse TES4 header from buffer
const parseTES4Header = (buffer: Buffer, verbose: boolean = false): E.Either<Error, { header: TES4Header, nextOffset: number }> => {
  const headerResult = readRecordHeader(buffer, 0, verbose);
  if (E.isLeft(headerResult)) {
    return E.left(headerResult.left);
  }
  const header = headerResult.right;
  if (header.type !== 'TES4') {
    return E.left(new Error('Invalid TES4 header'));
  }
  let offset = RECORD_HEADER_SIZE;
  let author = '';
  let description = '';
  let masterFiles: string[] = [];
  let timestamp = 0;
  let versionControlInfo = 0;
  let internalVersion = 0;
  while (offset < header.dataSize + RECORD_HEADER_SIZE) {
    const subrecordResult = readSubrecord(buffer, offset, verbose);
    if (E.isLeft(subrecordResult)) {
      return E.left(subrecordResult.left);
    }
    const { subrecord, newOffset } = subrecordResult.right;
    if (verbose) {
      console.error(`[TES4 SUBRECORD] Type: ${subrecord.type}, Offset: ${offset}, Size: ${subrecord.size}`);
    }
    switch (subrecord.type) {
      case 'HEDR':
        timestamp = subrecord.data.readUInt32LE(0);
        versionControlInfo = subrecord.data.readUInt32LE(4);
        internalVersion = subrecord.data.readUInt32LE(8);
        break;
      case 'CNAM':
        author = subrecord.data.toString('utf8').replace(/\0/g, '');
        break;
      case 'SNAM':
        description = subrecord.data.toString('utf8').replace(/\0/g, '');
        break;
      case 'MAST':
        masterFiles.push(subrecord.data.toString('utf8').replace(/\0/g, ''));
        break;
    }
    offset = newOffset;
  }
  // Log the offset and next 32 bytes after TES4 header
  if (verbose) {
    console.error(`[TES4 END] Next record offset: ${offset}, Next 32 bytes:`, buffer.slice(offset, offset + 32).toString('hex'));
  }
  return E.right({
    header: {
      type: header.type,
      version: header.version,
      author,
      description,
      masterFiles,
      timestamp,
      versionControlInfo,
      internalVersion,
      loadOrder: 0 // Assuming default loadOrder
    },
    nextOffset: offset
  });
};

// File-based: read TES4 header from file
export const readTES4Header = (filePath: string, verbose: boolean = false): TE.TaskEither<Error, TES4Header> =>
  pipe(
    TE.tryCatch(
      () => fs.readFile(filePath),
      (err) => new Error(`Failed to read file: ${filePath}`)
    ),
    TE.chain((buffer: Buffer) =>
      pipe(
        parseTES4Header(buffer, verbose),
        E.map(({ header }) => header),
        TE.fromEither
      )
    )
  );

// File-based: read all records from file
export const readRecords = (filePath: string, verbose: boolean = false): TE.TaskEither<Error, PluginRecord[]> =>
  pipe(
    TE.tryCatch(
      () => fs.readFile(filePath),
      (err) => new Error(`Failed to read file: ${filePath}`)
    ),
    TE.chain((buffer: Buffer) => {
      const records: PluginRecord[] = [];
      let offset = 0;

      // First read TES4 header
      const headerResult = parseTES4Header(buffer, verbose);
      if (E.isLeft(headerResult)) {
        return TE.left(headerResult.left);
      }
      offset = headerResult.right.nextOffset;

      // Then read all other records
      while (offset < buffer.length) {
        if (verbose) {
          console.error(`[RECORD LOOP] Offset: ${offset}, Next 32 bytes:`, buffer.slice(offset, offset + 32).toString('hex'));
        }
        const headerResult = readRecordHeader(buffer, offset, verbose);
        if (E.isLeft(headerResult)) {
          break;
        }
        const header = headerResult.right;
        if (header.type === 'GRUP') {
          // For GRUP records, never decompress
          records.push({ header, subrecords: [], type: header.type, formId: header.formId, offset, data: Buffer.from([]) });
          offset += RECORD_HEADER_SIZE + header.dataSize;
          continue;
        }
        const isCompressed = (header.flags & COMPRESSED_FLAG) !== 0;
        let dataBuffer = buffer.slice(offset + RECORD_HEADER_SIZE, offset + RECORD_HEADER_SIZE + header.dataSize);

        if (isCompressed) {
          const decompressedResult = decompressRecord(dataBuffer, verbose, { type: header.type, offset, size: header.dataSize });
          if (E.isLeft(decompressedResult)) {
            return TE.left(decompressedResult.left);
          }
          dataBuffer = decompressedResult.right;
        }

        const subrecords: Subrecord[] = [];
        let dataOffset = 0;

        while (dataOffset < dataBuffer.length) {
          const subrecordResult = readSubrecord(dataBuffer, dataOffset, verbose);
          if (E.isLeft(subrecordResult)) {
            return TE.left(subrecordResult.left);
          }

          const { subrecord, newOffset } = subrecordResult.right;
          subrecords.push(subrecord);
          dataOffset = newOffset;
        }

        records.push({ header, subrecords, type: header.type, formId: header.formId, offset, data: dataBuffer });
        offset += RECORD_HEADER_SIZE + header.dataSize;
      }
      return TE.right(records);
    })
  );

// File-based: summarize file contents
export const summarizeFile = (filePath: string, verbose: boolean = false): TE.TaskEither<Error, RecordSummary> =>
  pipe(
    TE.tryCatch(
      () => fs.readFile(filePath),
      (err) => new Error(`Failed to read file: ${filePath}`)
    ),
    TE.chain((buffer: Buffer) => {
      const recordCounts: Record<string, number> = {};
      let totalRecords = 0;
      let totalSubrecords = 0;
      let offset = 0;

      // First read TES4 header
      const headerResult = parseTES4Header(buffer, verbose);
      if (E.isLeft(headerResult)) {
        return TE.left(headerResult.left);
      }
      const header = headerResult.right.header;
      offset = headerResult.right.nextOffset;

      // Then count all records
      while (offset < buffer.length) {
        const headerResult = readRecordHeader(buffer, offset, verbose);
        if (E.isLeft(headerResult)) {
          break;
        }
        const header = headerResult.right;
        if (header.type === 'GRUP') {
          offset += RECORD_HEADER_SIZE + header.dataSize;
          continue;
        }
        recordCounts[header.type] = (recordCounts[header.type] || 0) + 1;
        totalRecords++;

        const isCompressed = (header.flags & COMPRESSED_FLAG) !== 0;
        let dataBuffer = buffer.slice(offset + RECORD_HEADER_SIZE, offset + RECORD_HEADER_SIZE + header.dataSize);

        if (isCompressed) {
          const decompressedResult = decompressRecord(dataBuffer, verbose, { type: header.type, offset, size: header.dataSize });
          if (E.isLeft(decompressedResult)) {
            return TE.left(decompressedResult.left);
          }
          dataBuffer = decompressedResult.right;
        }

        let dataOffset = 0;
        while (dataOffset < dataBuffer.length) {
          const subrecordResult = readSubrecord(dataBuffer, dataOffset, verbose);
          if (E.isLeft(subrecordResult)) {
            return TE.left(subrecordResult.left);
          }
          const { newOffset } = subrecordResult.right;
          totalSubrecords++;
          dataOffset = newOffset;
        }

        offset += RECORD_HEADER_SIZE + header.dataSize;
      }

      return TE.right({
        header,
        totalRecords,
        totalSubrecords,
        fileSize: buffer.length,
        recordCounts
      });
    })
  ); 