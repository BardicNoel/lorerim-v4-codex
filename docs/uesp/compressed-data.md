# 🗜 Handling Compressed Record Data

In Skyrim plugin files (ESM/ESP/ESL), some records are compressed to save space. This document explains how to detect and decompress those records for binary parsing.

---

## 🧭 When Is a Record Compressed?

Check the **record header flags** at offset `0x0C`. If the **bit 18** flag is set (`0x00040000`), the record's data is compressed.

```ts
const isCompressed = (flags & 0x00040000) !== 0;
```

---

## 📦 Record Layout Recap

| Offset | Size  | Field        | Notes                        |
|--------|-------|--------------|------------------------------|
| 0x00   | 4     | Record Type  | e.g., "NPC_", "WEAP", etc.   |
| 0x04   | 4     | Data Size    | Size of compressed data      |
| 0x0C   | 4     | Flags        | Check for 0x00040000         |
| 0x18   | N     | Record Data  | Compressed if flag is set    |

---

## 🧨 Decompression in Node.js (TypeScript)

You can use Node’s built-in `zlib` module to inflate the DEFLATE-compressed data.

```ts
import { inflateSync } from 'zlib';

function decompressRecordData(buffer: Buffer, dataSize: number): Buffer {
  const headerLength = 0x18;
  const compressedData = buffer.slice(headerLength, headerLength + dataSize);
  return inflateSync(compressedData);
}
```

---

## 🔄 Fallback for Uncompressed Data

```ts
function getRecordData(buffer: Buffer, isCompressed: boolean, dataSize: number): Buffer {
  const headerLength = 0x18;
  const data = buffer.slice(headerLength, headerLength + dataSize);
  return isCompressed ? inflateSync(data) : data;
}
```

---

## 🎯 Result

The returned buffer contains uncompressed subrecords (e.g., `EDID`, `FULL`, etc.), and can now be parsed as usual.
