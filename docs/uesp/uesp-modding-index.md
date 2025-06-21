# 📚 UESP Modding Documentation Index

This directory contains documentation about the UESP (Unofficial Elder Scrolls Pages) modding format and record structure.

## 📋 Contents

### Core Record Structure
- [Top-Level Records](top-level.md) - Documentation about top-level record types, buffer metadata, and GRUP records
- [Subrecords](subrecords.md) - Information about subrecord format and structure
- [EDID Records](edid.md) - Details about Editor ID (EDID) subrecords and parsing
- [Record Flags](flags.md) - Documentation about record header flags and their meanings

## 🔍 Quick Reference

### Record Types
- Top-level records (e.g., `ARMO`, `WEAP`, `NPC_`)
- GRUP records (container records)
- TSE4 records (terminal records)

### Common Subrecords
- EDID (Editor ID)
- FULL (Full Name)
- And many more record-specific subrecords

### Important Offsets
- Record Type: `+0x00` (4 bytes)
- Data Size: `+0x04` (4 bytes)
- FormID: `+0x08` (4 bytes)
- Flags: `+0x0C` (4 bytes)
- Timestamp/Version: `+0x10` (4 bytes)

## 📝 Notes
- All offsets are relative to the start of the record
- Most values are stored in little-endian format
- Subrecord sizes are typically 2 bytes, but some use extended sizes
