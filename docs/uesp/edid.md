# 🔎 Identifying the EDID

- `EDID` (Editor ID) is typically the first or second subrecord in most top-level records
- Appears as:
  ```
  45 44 49 44    ; "EDID"
  xx xx          ; Size (e.g., 10 for "IronSword")
  ...data...
  ```

## Parsing Logic
- Check for the string `"EDID"` (0x45444944) at subrecord type offset
- Read 2-byte size (little endian)
- Read string payload (usually UTF-8 or ASCII), not null-terminated
