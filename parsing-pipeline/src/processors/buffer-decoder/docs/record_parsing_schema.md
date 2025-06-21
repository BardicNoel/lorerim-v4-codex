# Record Data Parsing and Schema Composition

## Overview

This document defines the design and structure for parsing binary record data in Skyrim plugin files using a declarative and composable schema system. The approach emphasizes reuse, maintainability, and separation of parsing logic from binary structure definitions.

## Goals

- Use a declarative schema system to define how each subrecord (field) should be parsed
- Allow field schemas to be reused across record types
- Enable nested and composable struct definitions
- Maintain high clarity and flexibility in decoding plugin records
- Support post-processing parsers for complex field transformations

## Architecture

### 1. Schema Hierarchy

The system uses a three-tier schema hierarchy:

1. **Common Fields** - Shared across all record types (EDID, FULL, DESC, etc.)
2. **Record-Specific Schemas** - Override common fields and add record-specific fields
3. **Shared Field Fragments** - Reusable internal field layouts for struct composition

### 2. Schema Resolution

Schema resolution follows this priority order:

1. Record-specific schema for the field tag
2. If not found, the field is skipped (no fallback to common fields)

```typescript
public getFieldSchema(recordType: string, tag: string): FieldSchema | undefined {
  return recordSpecificSchemas[recordType]?.[tag];
}
```

## Components

### 1. Common Field Schemas

Common fields are defined in `createSchema.ts` and automatically included in all record schemas:

```typescript
export const commonFieldSchemas: RecordSchema = {
  EDID: { type: 'string', encoding: 'utf8' },
  FULL: { type: 'string', encoding: 'utf8' },
  DESC: { type: 'string', encoding: 'utf8' },
  ICON: { type: 'string', encoding: 'utf8' },
  DNAM: { type: 'string', encoding: 'utf8' },
  KSIZ: { type: 'uint32' },
  KWDA: { type: 'array', element: { type: 'formid' } },
  NNAM: { type: 'formid' },
};
```

### 2. Shared Field Fragments

Shared internal field layouts are defined as reusable fragments for use in composed structs:

```typescript
export const sharedFields: SharedFields = {
  flags8: [{ name: 'flags', type: 'uint8' }],
  flags32: [{ name: 'flags', type: 'uint32' }],
  conditionBlock: [
    { name: 'op', type: 'uint8' },
    { name: 'value', type: 'float32' },
    { name: 'functionIndex', type: 'uint32' },
  ],
};
```

> **Important**: When defining struct fields, the order of fields is critical and must match the exact binary layout of the record. The parser reads fields sequentially in the order they are defined, so any mismatch in order will result in incorrect parsing.

### 3. Record-Specific Schemas

Schemas for each record type are created using the `createSchema` function, which merges common fields with record-specific overrides:

```typescript
export const createSchema = (recordName: string, schema: SchemaInternal): RecordSpecificSchemas => {
  return {
    [recordName]: {
      // Add common fields first
      ...commonFieldSchemas,
      // Then add record-specific fields, which will override any common fields with the same name
      ...schema,
    },
  } as RecordSpecificSchemas;
};
```

Example record schema creation:

```typescript
export const spelSchema: RecordSpecificSchemas = createSchema('SPEL', {
  SPIT: {
    type: 'struct',
    fields: [
      { name: 'spellCost', type: 'uint32' },
      { name: 'flags', type: 'uint32', parser: flagParserGenerator(SPEL_FLAGS) },
      {
        name: 'type',
        type: 'uint32',
        parser: (value: number) => SPEL_TYPE[value] || `Unknown(${value})`,
      },
      { name: 'chargeTime', type: 'float32' },
      // ... more fields
    ],
  },
  EFIT: {
    type: 'array',
    element: {
      type: 'struct',
      size: 12, // Fixed size struct
      fields: [
        { name: 'magnitude', type: 'float32' },
        { name: 'area', type: 'uint32' },
        { name: 'duration', type: 'uint32' },
      ],
    },
  },
});
```

### 4. Field Schema Types

The system supports multiple field types with specific schemas:

```typescript
export type FieldType =
  | 'string' // UTF-8/UTF-16/ASCII encoded strings
  | 'int32' // 32-bit signed integer
  | 'uint8' // 8-bit unsigned integer
  | 'uint16' // 16-bit unsigned integer
  | 'uint32' // 32-bit unsigned integer
  | 'float32' // 32-bit floating point
  | 'struct' // Composite field with named sub-fields
  | 'formid' // Form ID reference
  | 'array' // Variable-length array of elements
  | 'unknown'; // Skip parsing, just advance offset
```

### 5. Post-Processing Parsers

Fields can include custom parsers for complex transformations:

```typescript
// Flag parser generator
export const flagParserGenerator = (flagsMap: Record<number, string>) => {
  return (value: number): string[] => {
    return Object.entries(flagsMap)
      .filter(([bit]) => (value & Number(bit)) !== 0)
      .map(([, label]) => label);
  };
};

// Map parser generator
export const mapParserGenerator = (map: Record<number, any>) => {
  return (value: number): any => {
    const resolved = map[value];
    return resolved ?? null;
  };
};
```

### 6. Record Parsing Process

The main parsing process follows these steps:

1. **Buffer Creation**: Convert field data arrays to Buffer objects
2. **Schema Lookup**: Find the appropriate schema for the record type and field
3. **Field Parsing**: Parse the field according to its schema type
4. **Error Handling**: Capture and report parsing errors without stopping the process

```typescript
function processRecordFields(
  record: ParsedRecord,
  config: BufferDecoderConfig,
  decoder: BufferDecoder
): ProcessRecordResult {
  const processedRecord = { ...record } as ParsedRecord;
  let hasDecodedFields = false;
  let recordErrors = 0;

  for (const [fieldName, fieldData] of Object.entries(processedRecord.data)) {
    if (!Array.isArray(fieldData) || fieldData.length === 0) continue;

    const buffer = createBufferFromFieldData(fieldData);
    if (!buffer) continue;

    try {
      const schema = decoder.getFieldSchema(config.recordType, fieldName);
      if (!schema) continue;

      let decodedField;
      switch (schema.type) {
        case 'string':
          decodedField = decoder.parseString(buffer, 0, schema.encoding, schema.parser);
          break;
        case 'formid':
          decodedField = decoder.parseFormId(buffer, 0, schema.parser);
          break;
        case 'struct':
          decodedField = decoder.parseStruct(buffer, 0, buffer.length, schema.fields);
          break;
        // ... other cases
      }

      if (!processedRecord.decodedData) {
        processedRecord.decodedData = {};
      }
      processedRecord.decodedData[fieldName] = decodedField;
      hasDecodedFields = true;
    } catch (error) {
      // Handle and log errors
      recordErrors++;
    }
  }

  return { processedRecord, hasDecodedFields, recordErrors };
}
```

## Schema Organization

### File Structure

```
schema/
├── schemaTypes.ts          # Type definitions and interfaces
├── createSchema.ts         # Schema creation utilities
├── fullSchema.ts           # Main schema registry
├── generics.ts            # Reusable parser generators
├── actorValueMapRecord.ts # Actor value mappings
└── entities/
    ├── mgef.ts            # Magic effect schemas
    ├── perk.ts            # Perk schemas
    └── spel.ts            # Spell schemas
```

### Schema Registration

All record schemas are registered in `fullSchema.ts`:

```typescript
export const recordSpecificSchemas: RecordSpecificSchemas = {
  ...createSchema('CELL', {
    DATA: {
      type: 'struct',
      fields: [...sharedFields.flags32, { name: 'lightLevel', type: 'uint8' }],
    },
  }),
  ...mgefSchema,
  ...spelSchema,
  ...perkSchema,
};
```

## Error Handling and Debugging

The system includes comprehensive error handling and debugging capabilities:

- **Buffer Validation**: Checks for minimum buffer sizes and valid field headers
- **Offset Tracking**: Monitors buffer position to prevent overruns
- **Error Logging**: Captures detailed error information with context
- **Debug Output**: Generates debug files for inspection of problematic records
- **Graceful Degradation**: Continues processing even when individual fields fail

## Summary

This system provides a modular and reusable way to describe how Skyrim record data should be parsed. By separating common fields, record-specific overrides, and shared internal fragments, the schema remains scalable and maintainable as coverage expands to more record types and variants. The use of post-processing parsers enables complex transformations while keeping the core parsing logic clean and efficient.
