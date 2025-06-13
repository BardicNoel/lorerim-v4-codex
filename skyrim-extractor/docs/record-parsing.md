# Skyrim Plugin Record Parsing Guide

## Record Types Overview

The parser handles four main types of records:

1. **GRUP Records**
   - Signature: 'GRUP'
   - 24-byte header
   - Contains groups of related records
   - Special handling required
   - **Must be unpacked into normal records**

2. **TES4 Records**
   - Signature: 'TES4'
   - 20-byte header
   - Contains plugin metadata
   - Always first record in file

3. **Normal Records**
   - Any valid 4-character record type
   - 20-byte header
   - Contains actual game data
   - Most common record type
   - **Final form of all records**

4. **Unknown Records**
   - Invalid or corrupted records
   - Should be logged and skipped
   - May indicate file corruption

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

## GRUP Unpacking Strategy

### Goal
Convert all GRUP records into their constituent normal records, preserving:
- Record type (from GRUP label for Top-Level)
- Form IDs
- Record data
- Plugin context

### Process
1. **Top-Level GRUP Unpacking**
   ```typescript
   function unpackTopLevelGRUP(buffer: Buffer, offset: number, grupHeader: GRUPHeader): ParsedRecord[] {
     const records: ParsedRecord[] = [];
     const recordType = grupHeader.label.toString('ascii');
     let currentOffset = offset + 24; // Skip GRUP header
     
     while (currentOffset < offset + grupHeader.size) {
       const recordHeader = parseRecordHeader(buffer.slice(currentOffset, currentOffset + 20));
       const recordData = buffer.slice(currentOffset + 20, currentOffset + 20 + recordHeader.dataSize);
       
       records.push({
         meta: {
           type: recordType,
           formId: recordHeader.formId,
           plugin: currentPlugin
         },
         data: parseSubrecords(recordData),
         header: buffer.slice(currentOffset, currentOffset + 20).toString('base64')
       });
       
       currentOffset += 20 + recordHeader.dataSize;
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
         // Recursively unpack nested GRUP
         const nestedRecords = unpackGRUP(buffer, currentOffset);
         records.push(...nestedRecords);
       } else {
         // Process normal record
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

### Benefits
1. **Simplified Processing**
   - All records become normal records
   - Consistent handling regardless of source
   - Easier to validate and process

2. **Memory Efficiency**
   - Process records as they're unpacked
   - Don't need to maintain GRUP hierarchy
   - Can stream records to output

3. **Error Handling**
   - Validate each record individually
   - Clear error context
   - Easier to recover from errors

### Implementation Notes
1. **Record Context**
   - Preserve plugin name
   - Keep form IDs
   - Maintain record order

2. **Performance**
   - Process records as they're unpacked
   - Avoid unnecessary buffer copies
   - Use GRUP size for bounds checking

3. **Validation**
   - Verify record types match GRUP label
   - Check record sizes
   - Validate form IDs

## GRUP Parsing Strategy

### Top-Level GRUPs (Type 0)
- Label field contains the record type (e.g., 'NPC_', 'ARMO')
- All child records are guaranteed to be of this type
- No need to revalidate record types
- Can optimize parsing by:
  - Pre-allocating structures
  - Using type-specific handlers
  - Skipping redundant type checks

### Other GRUP Types
- Contain specific record types based on context
- May contain nested GRUPs
- Need to validate record types
- Size field helps prevent buffer overruns

## Parsing Flow

1. **Initial Record Type Check**
   ```typescript
   const recordType = getRecordTypeAt(buffer, offset);
   switch (recordType) {
     case 'GRUP':
       return processGRUP(buffer, offset);
     case 'TES4':
       return processTES4(buffer, offset);
     case 'NORMAL':
       return processNormalRecord(buffer, offset);
     default:
       return handleUnknownRecord(buffer, offset);
   }
   ```

2. **GRUP Processing**
   ```typescript
   function processGRUP(buffer: Buffer, offset: number) {
     const header = parseGRUPHeader(buffer, offset);
     
     // For Top-Level GRUPs, we know the record type
     if (header.groupType === 0) {
       const recordType = header.label.toString('ascii');
       return processGRUPChildren(buffer, offset + 24, header.size - 24, recordType);
     }
     
     // For other GRUPs, need to check each record
     return processGRUPChildren(buffer, offset + 24, header.size - 24);
   }
   ```

3. **GRUP Children Processing**
   ```typescript
   function processGRUPChildren(buffer: Buffer, start: number, size: number, knownType?: string) {
     const end = start + size;
     let offset = start;
     
     while (offset < end) {
       if (knownType) {
         // Skip type check, use known type
         processRecord(buffer, offset, knownType);
       } else {
         // Need to check type
         const type = getRecordTypeAt(buffer, offset);
         processRecord(buffer, offset, type);
       }
       offset = getNextRecordOffset(buffer, offset);
     }
   }
   ```

## Optimization Opportunities

1. **Type Validation**
   - Skip type checks inside Top-Level GRUPs
   - Cache type-specific handlers
   - Use type-specific data structures

2. **Buffer Management**
   - Use GRUP size to limit buffer slices
   - Pre-allocate buffers for known record types
   - Avoid unnecessary buffer copies

3. **Error Handling**
   - Validate GRUP boundaries
   - Check for nested GRUP consistency
   - Log invalid record types

## Debugging Tips

1. **GRUP Validation**
   - Check group type is valid (0-9)
   - Verify label format for Top-Level GRUPs
   - Validate size doesn't exceed file bounds

2. **Record Type Verification**
   - Log unexpected record types in GRUPs
   - Track record counts per GRUP
   - Validate child record types match GRUP label

3. **Performance Monitoring**
   - Track time spent in each record type
   - Monitor buffer allocations
   - Count type validation skips

## Common Issues

1. **Invalid GRUP Sizes**
   - Size field doesn't match actual content
   - Nested GRUPs exceed parent size
   - Buffer overruns

2. **Type Mismatches**
   - Child records don't match GRUP label
   - Invalid record types in GRUPs
   - Corrupted record headers

3. **Buffer Management**
   - Incorrect offset calculations
   - Missing size validations
   - Buffer underruns

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
     // Skip type checks for children
     const recordType = header.label.toString('ascii');
     return processChildren(buffer, offset, size, recordType);
   }
   ```

3. **Handle nested GRUPs properly**
   ```typescript
   if (childType === 'GRUP') {
     // Process nested GRUP
     return processGRUP(buffer, childOffset);
   }
   ```

4. **Log unexpected conditions**
   ```typescript
   if (recordType !== expectedType) {
     log(`Unexpected record type ${recordType} in GRUP labeled ${grupLabel}`);
   }
   ``` 