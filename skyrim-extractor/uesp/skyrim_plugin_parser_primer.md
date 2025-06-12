# Skyrim Plugin Binary Parsing with Node.js

This document is a primer for building a high-performance parser to handle Skyrim ESP/ESM binary plugin files using Node.js.

## 📄 File Structure Overview

- Skyrim plugins are binary files composed of **records**, each with a fixed 24-byte header followed by variable-size data blocks.
- Special `GRUP` records define nested groupings of other records or subgroups.
- **Not all ESP/ESM files contain GRUP records**; some may be a flat sequence of records, a sequence of GRUPs, or a mix. Your parser must handle all these cases.

## 📦 Record Header Layout (24 bytes)

| Offset | Size | Field       | Type         |
|--------|------|-------------|--------------|
| 0      | 4    | Type        | ASCII string |
| 4      | 4    | Data Size   | UInt32LE     |
| 8      | 4    | Flags       | UInt32LE     |
| 12     | 4    | FormID      | UInt32LE     |
| 16     | 2    | Timestamp   | UInt16LE     |
| 18     | 2    | Version     | UInt16LE     |
| 20     | 4    | Unknown     | UInt32LE     |

## 🔁 Subrecord Format

Subrecords within the data block of a record:

| Offset | Size | Field            | Type         |
|--------|------|------------------|--------------|
| 0      | 4    | Subrecord Type   | ASCII string |
| 4      | 2    | Subrecord Length | UInt16LE     |
| 6      | N    | Payload          | byte[]       |

Repeat until full record `Data Size` is consumed.

## 🔢 FormIDs and Load Order

- FormIDs use the top byte to indicate the plugin index.
- Load order is determined by reading `plugins.txt` or `loadorder.txt`.
- Later plugins override earlier ones for matching FormIDs.

## 🧠 Node.js Implementation Tips

- Use `fs.createReadStream` with a high buffer size:
  ```js
  const stream = fs.createReadStream("plugin.esp", { highWaterMark: 65536 });
  ```
- Always buffer across chunks — records may span multiple read chunks.
- Process in a stateful loop, tracking buffer offset until a complete record and its subrecords are parsed.
- **At each step, read the next 4 bytes:**
  - If `"GRUP"`, parse as a group container (recursively if needed).
  - If another 4-letter type, parse as a regular record.
  - Continue until the end of the file.

## 🛠️ Useful Functions

```js
function readRecordHeader(buffer, offset) { /* parse 24-byte record header */ }
function parseSubrecords(buffer, dataSize) { /* parse subrecords inside a record */ }
function extractFormID(buffer) { /* parse and decode FormID */ }
```

## 🗂️ GRUP Handling

- GRUP records also use 24-byte headers.
- Use the `Label` and `GroupType` fields to route group parsing.
- Recursively descend into sub-GRUPs when encountered.
- **GRUP records are never compressed**; only non-GRUP records may be compressed (check the compression flag before decompressing).

## 🧩 Compression Notes

- Some non-GRUP records may be compressed using zlib (check the Flags field for the compression flag `0x00040000`).
- Use `zlib.inflateSync` to decompress payloads if required.
- **Never attempt to decompress GRUP records, regardless of their flags.**

## 🧪 Robust Test Design for Plugin Parsing

- Do not assume every plugin will contain GRUP or compressed records.
- Tests should:
  - Assert the presence of at least one valid record (e.g., TES4), not GRUP.
  - Handle the absence of compressed records gracefully (skip or pass the test if none are present).
  - Validate that the parser does not throw or fail on files with only flat records, only GRUPs, or a mix.

## 📚 Reference

- [UESP Mod File Format](https://en.uesp.net/wiki/Skyrim_Mod:Mod_File_Format)
- `skyrim_record_definitions_full.json` for subrecord specs and data types

