# 🗂 Top-Level Record Scanner

## 🎯 Record Types
- `GRUP`: Container for nested records (can include top-level and interior GRUPs)
- Standard Top-Level Records: E.g., `ARMO`, `WEAP`, `NPC_`, etc.
- `TSE4`: Special terminal record (marks end of file, not always present)

## 📦 Buffer Meta
Each top-level entry starts at a 4-byte signature:
- Offset `+0x00` – 4 bytes – Record Type (ASCII)
- Offset `+0x04` – 4 bytes – Data Size
- Offset `+0x08` – 4 bytes – FormID (0 for GRUP)
- Offset `+0x0C` – 4 bytes – Flags
- Offset `+0x10` – 4 bytes – Timestamp + Version
- Offset `+0x14` – 2 bytes – Unknown (usually 0)
- Offset `+0x16` – 2 bytes – Subrecord Count or Version
- Offset `+0x18` – ... – Record Data (variable)

## ⚠️ GRUP Records
- Use 20-byte headers, similar to standard records
- `Data Size` refers to the full size of the group’s content (not just the header)
- GRUPs nest and contain other GRUPs or standard records

## 🔚 TSE4 Record
- Unique top-level record
- Typically signifies the end of a plugin
- May be skipped by some parsers

## 🧮 Flags Explanation (at Offset 0x0C)

| Bit        | Hex Value   | Meaning                      |
|------------|-------------|------------------------------|
| Bit 0      | 0x00000001  | Record is deleted (`DELETED`)|
| Bit 1      | 0x00000002  | Persistent                   |
| Bit 2      | 0x00000004  | Initially disabled           |
| Bit 3      | 0x00000008  | Ignored (null reference)     |
| Bit 6      | 0x00000040  | Visible when distant         |
| Bit 9      | 0x00000200  | Dangerous                    |
| Bit 10     | 0x00000400  | Compressed (obsolete)        |
| Bit 18     | 0x00040000  | **Compressed** (zlib, used)  |

### 🗜 Compression Handling
If bit 18 (`0x00040000`) is set:
- The record's **data field (after offset 0x18)** is compressed using zlib (DEFLATE).
- You must decompress before attempting to parse subrecords like `EDID`, `FULL`, etc.

```cpp
uint32_t flags = read_uint32_le(buffer + 0x0C);
bool is_compressed = flags & 0x00040000;
