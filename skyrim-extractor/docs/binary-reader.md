# Binary Reader Module

The binary reader module provides functionality for reading and parsing Skyrim ESP/ESM files. It uses a functional programming approach with `fp-ts` for error handling and data transformation.

## Overview

The module handles:
- Reading TES4 headers
- Parsing records and subrecords
- Generating file summaries
- Error handling for invalid files

## Types

### TES4Header
```typescript
interface TES4Header {
  type: 'TES4';
  version: number;
  flags: number;
  timestamp: number;
  author: string;
  description: string;
  masterFiles: string[];
}
```
Represents the header information of a Skyrim ESP/ESM file.

### RecordHeader
```typescript
interface RecordHeader {
  type: string;
  dataSize: number;
  flags: number;
  formId: number;
  timestamp: number;
  versionControlInfo: number;
  internalVersion: number;
}
```
Represents the header of a record in the file.

### Subrecord
```typescript
interface Subrecord {
  type: string;
  data: Buffer;
}
```
Represents a subrecord within a record.

### Record
```typescript
interface Record {
  header: RecordHeader;
  subrecords: Subrecord[];
}
```
Represents a complete record with its header and subrecords.

### FileSummary
```typescript
interface FileSummary {
  header: TES4Header;
  recordCounts: { [key: string]: number };
  totalRecords: number;
  totalSubrecords: number;
  fileSize: number;
}
```
Provides a summary of the file contents.

## Functions

### readTES4Header
```typescript
function readTES4Header(filePath: string): TaskEither<Error, TES4Header>
```
Reads and parses the TES4 header from a Skyrim ESP/ESM file.

**Parameters:**
- `filePath`: Path to the ESP/ESM file

**Returns:**
- `TaskEither<Error, TES4Header>`: Either an error or the parsed header

**Example:**
```typescript
const result = await readTES4Header('path/to/mod.esp')();
if (E.isRight(result)) {
  console.log(result.right.author); // "Mod Author"
}
```

### readRecords
```typescript
function readRecords(filePath: string): TaskEither<Error, Record[]>
```
Reads all records from a Skyrim ESP/ESM file.

**Parameters:**
- `filePath`: Path to the ESP/ESM file

**Returns:**
- `TaskEither<Error, Record[]>`: Either an error or an array of records

**Example:**
```typescript
const result = await readRecords('path/to/mod.esp')();
if (E.isRight(result)) {
  result.right.forEach(record => {
    console.log(record.header.type); // Record type (e.g., "NPC_", "CELL")
  });
}
```

### summarizeFile
```typescript
function summarizeFile(filePath: string): TaskEither<Error, FileSummary>
```
Generates a summary of the ESP/ESM file contents.

**Parameters:**
- `filePath`: Path to the ESP/ESM file

**Returns:**
- `TaskEither<Error, FileSummary>`: Either an error or a file summary

**Example:**
```typescript
const result = await summarizeFile('path/to/mod.esp')();
if (E.isRight(result)) {
  console.log(result.right.recordCounts); // { "NPC_": 10, "CELL": 5, ... }
  console.log(result.right.totalRecords); // 15
}
```

## Error Handling

The module uses `fp-ts`'s `TaskEither` for error handling. All functions return either:
- `Right<T>`: Successful result
- `Left<Error>`: Error with message

Common errors include:
- File not found
- Invalid file format
- Corrupted data
- Read errors

## Usage Example

```typescript
import { readTES4Header, readRecords, summarizeFile } from './binary-reader';

async function analyzeMod(filePath: string) {
  // Read header
  const headerResult = await readTES4Header(filePath)();
  if (E.isLeft(headerResult)) {
    console.error('Failed to read header:', headerResult.left.message);
    return;
  }
  console.log('Mod author:', headerResult.right.author);

  // Get summary
  const summaryResult = await summarizeFile(filePath)();
  if (E.isLeft(summaryResult)) {
    console.error('Failed to get summary:', summaryResult.left.message);
    return;
  }
  console.log('Record counts:', summaryResult.right.recordCounts);
  console.log('Total records:', summaryResult.right.totalRecords);

  // Read specific records
  const recordsResult = await readRecords(filePath)();
  if (E.isLeft(recordsResult)) {
    console.error('Failed to read records:', recordsResult.left.message);
    return;
  }
  
  // Filter for specific record type
  const npcRecords = recordsResult.right.filter(
    record => record.header.type === 'NPC_'
  );
  console.log('Found NPC records:', npcRecords.length);
}
```

## File Format

Skyrim ESP/ESM files follow this structure:
1. TES4 Header Record
   - Record header (type, size, flags, etc.)
   - Subrecords (HEDR, CNAM, SNAM, MAST)
2. Game Records
   - Record header
   - Subrecords specific to record type

## Limitations

- Currently only supports uncompressed records
- Limited to basic record types
- No support for record editing
- No support for ESM-specific features

## Future Improvements

1. Support for compressed records
2. Specific record type parsers
3. Record editing capabilities
4. ESM-specific features
5. Record validation
6. Form ID resolution
7. Master file dependency resolution 