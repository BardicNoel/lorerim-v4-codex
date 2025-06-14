# Skyrim Plugin Record Parsing Guide

## Record Types Overview

The parser handles four main types of records:

1. **GRUP Records**

   * Signature: 'GRUP'
   * 24-byte header
   * Contains groups of related records
   * Special handling required
   * **Must be unpacked into normal records**

2. **TES4 Records**

   * Signature: 'TES4'
   * 24-byte header
   * Contains plugin metadata
   * Always the first record in file

3. **Normal Records**

   * Any valid 4-character record type (e.g., 'RACE', 'SPEL', etc.)
   * 24-byte header
   * Contains actual game data
   * Most common record type
   * **Final form of all records**

4. **Unknown Records**

   * Invalid or corrupted records
   * Should be logged and skipped
   * May indicate file corruption

## GRUP Record Structure

### Header Format (24 bytes)

```
Offset  Size  Field
0x00    4     Signature ('GRUP')
0x04    4     Size (including header)
0x08    4     Label (record type for Top-Level)
0x0C    4     Group Type
0x10    2     Timestamp
0x12    2     Version Control
0x14    4     Unknown
```

### Group Types

```
0: Top-Level (by record type)
1: World Children
2: Interior Cell Block
3: Interior Cell Sub-Block
4: Exterior Cell Block
5: Exterior Cell Sub-Block
6: Cell Children
7: Topic Children
8: Cell Persistent Children
9: Cell Temporary Children
```

## GRUP Handling Rules

### Unsupported Record Types

1. **Individual Records**

   * If a record type is not in `PROCESSED_RECORD_TYPES`, skip it
   * Read the record's size from its header
   * Advance the buffer past the record (24-byte header + data)
   * Log: "Skipping record of type {type} because it's unsupported"

2. **Top-Level GRUPs**

   * If a GRUP's label (record type) is not in `PROCESSED_RECORD_TYPES`
   * Skip the entire GRUP and all its contents
   * Log: "Skipping group with label {type} because it's unsupported"

3. **Nested GRUPs**

   * Process all records within nested GRUPs
   * Only skip individual unsupported records within them
   * Preserve the GRUP hierarchy and context

### Supported Record Types

Currently supported record types:

* PERK (Perks)
* AVIF (Actor Value Information)
* RACE (Races)
* SPEL (Spells)
* MGEF (Magic Effects)

## GRUP Unpacking Strategy

### Goal

Convert all GRUP records into their constituent normal records, preserving:

* Record type (from GRUP label for Top-Level)
* Form IDs
* Record data
* Plugin context

### Process

1. **Top-Level GRUP Unpacking**

```typescript
function unpackTopLevelGRUP(buffer: Buffer, offset: number, grupHeader: GRUPHeader): ParsedRecord[] {
  const records: ParsedRecord[] = [];
  const recordType = grupHeader.label.toString('ascii');
  let currentOffset = offset + 24;

  while (currentOffset < offset + grupHeader.size) {
    const recordHeader = parseRecordHeader(buffer.slice(currentOffset, currentOffset + 24));
    const recordData = buffer.slice(currentOffset + 24, currentOffset + 24 + recordHeader.dataSize);

    records.push({
      meta: {
        type: recordType,
        formId: recordHeader.formId,
        plugin: currentPlugin
      },
      data: parseSubrecords(recordData),
      header: buffer.slice(currentOffset, currentOffset + 24).toString('base64')
    });

    currentOffset += 24 + recordHeader.dataSize;
  }

  return records;
}
```

2. **Nested GRUP Handling**

```typescript
function unpackNestedGRUP(buffer: Buffer, offset: number, grupHeader: GRUPHeader): ParsedRecord[] {
  const records: ParsedRecord[] = [];
  let currentOffset = offset + 24;

  while (currentOffset < offset + grupHeader.size) {
    const recordType = getRecordTypeAt(buffer, currentOffset);

    if (recordType === 'GRUP') {
      const nestedRecords = unpackGRUP(buffer, currentOffset);
      records.push(...nestedRecords);
    } else {
      const record = processNormalRecord(buffer, currentOffset);
      records.push(record);
    }

    currentOffset = getNextRecordOffset(buffer, currentOffset);
  }

  return records;
}
```

3. **GRUP Processing Entry Point**

```typescript
function unpackGRUP(buffer: Buffer, offset: number): ParsedRecord[] {
  const grupHeader = parseGRUPHeader(buffer, offset);

  if (grupHeader.groupType === 0) {
    return unpackTopLevelGRUP(buffer, offset, grupHeader);
  } else {
    return unpackNestedGRUP(buffer, offset, grupHeader);
  }
}
```

## Parsing Flow

1. **Initial Record Type Check**

```typescript
const recordType = getRecordTypeAt(buffer, offset);
switch (recordType) {
  case 'GRUP':
    return processGRUP(buffer, offset);
  case 'TES4':
    return processTES4(buffer, offset);
  default:
    return processNormalRecord(buffer, offset);
}
```

2. **GRUP Processing**

```typescript
function processGRUP(buffer: Buffer, offset: number) {
  const header = parseGRUPHeader(buffer, offset);

  if (header.groupType === 0) {
    const recordType = header.label.toString('ascii');
    return processGRUPChildren(buffer, offset + 24, header.size - 24, recordType);
  }

  return processGRUPChildren(buffer, offset + 24, header.size - 24);
}
```

3. **GRUP Children Processing**

```typescript
function processGRUPChildren(buffer: Buffer, start: number, size: number, knownType?: string) {
  const end = start + size;
  let offset = start;

  while (offset < end) {
    const type = knownType || getRecordTypeAt(buffer, offset);
    processRecord(buffer, offset, type);
    offset = getNextRecordOffset(buffer, offset);
  }
}
```

## Best Practices

1. **Always validate GRUP boundaries**

```typescript
if (offset + header.size > buffer.length) {
  throw new Error(`GRUP exceeds buffer bounds`);
}
```

2. **Use GRUP context for optimization**

```typescript
if (header.groupType === 0) {
  const recordType = header.label.toString('ascii');
  return processChildren(buffer, offset, size, recordType);
}
```

3. **Handle nested GRUPs properly**

```typescript
if (childType === 'GRUP') {
  return processGRUP(buffer, childOffset);
}
```

4. **Log unexpected conditions**

```typescript
if (recordType !== expectedType) {
  log(`Unexpected record type ${recordType} in GRUP labeled ${grupLabel}`);
}
```
