# 🔍 Subrecords

## 📄 Subrecord Format
Each subrecord inside a top-level record has the following structure:
- Offset `+0x00` – 4 bytes – Subrecord Type (e.g., `EDID`, `FULL`, etc.)
- Offset `+0x04` – 2 bytes – Subrecord Size (for most, 2 bytes)
- Offset `+0x06` – Variable – Subrecord Data

Note: Some newer formats use extended sizes (`XXXX` subrecord)
