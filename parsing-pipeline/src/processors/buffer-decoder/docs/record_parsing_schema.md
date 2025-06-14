# Record Data Parsing and Schema Composition

## Overview
This document defines the design and structure for parsing binary record data in Skyrim plugin files using a declarative and composable schema system. The approach emphasizes reuse, maintainability, and separation of parsing logic from binary structure definitions.

## Goals
- Use a declarative schema system to define how each subrecord (field) should be parsed
- Allow field schemas to be reused across record types
- Enable nested and composable struct definitions
- Maintain high clarity and flexibility in decoding plugin records

## Components

### 1. Field Schema
Each subrecord type (e.g., `EDID`, `FULL`, `DATA`) has a schema definition describing how to interpret its binary data.

```ts
const commonFieldSchemas = {
  EDID: { type: 'string', encoding: 'utf8' },
  FULL: { type: 'string', encoding: 'utf16le' },
  DESC: { type: 'string', encoding: 'utf16le' }
};
```

### 2. Reusable Field Fragments
Shared internal field layouts are defined as reusable fragments for use in composed structs.

```ts
const sharedFields = {
  flags8: [{ name: 'flags', type: 'uint8' }],
  flags32: [{ name: 'flags', type: 'uint32' }],
  conditionBlock: [
    { name: 'op', type: 'uint8' },
    { name: 'value', type: 'float32' },
    { name: 'functionIndex', type: 'uint32' }
  ]
};
```

### 3. Record-Specific Schemas
Schemas for each record type use the common field definitions and override or compose as needed.

```ts
const recordSpecificSchemas = {
  PERK: {
    DATA: {
      type: 'struct',
      fields: [
        ...sharedFields.flags8,
        { name: 'levelReq', type: 'uint8' },
        { name: 'numPRKE', type: 'uint8' }
      ]
    }
  },
  CELL: {
    DATA: {
      type: 'struct',
      fields: [
        ...sharedFields.flags32,
        { name: 'lightLevel', type: 'uint8' }
      ]
    }
  },
  SPEL: {
    DATA: {
      type: 'struct',
      fields: [
        { name: 'spellType', type: 'uint32' },
        { name: 'cost', type: 'uint32' },
        ...sharedFields.conditionBlock
      ]
    }
  }
};
```

### 4. Field Schema Resolution
Schema resolution merges common fields with overrides:

```ts
function getFieldSchema(recordType, tag) {
  return recordSpecificSchemas[recordType]?.[tag] || commonFieldSchemas[tag];
}
```

### 5. Example Record Parser
```ts
function parseRecord(recordType, buffer) {
  const result = {};
  let offset = 0;

  while (offset < buffer.length) {
    const tag = buffer.toString('ascii', offset, offset + 4);
    const schema = getFieldSchema(recordType, tag);
    if (schema) {
      result[tag] = parseSubrecord(buffer, offset, schema);
    }
    const length = buffer.readUInt16LE(offset + 2);
    offset += 4 + length;
  }

  return result;
}
```

## Summary
This system provides a modular and reusable way to describe how Skyrim record data should be parsed. By separating common fields, record-specific overrides, and shared internal fragments, the schema remains scalable and maintainable as coverage expands to more record types and variants.

