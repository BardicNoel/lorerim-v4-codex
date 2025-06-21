# 🧮 Bitwise Flags (Header Only)

## 🎛 Header Flag Offset: `+0x0C` (4 bytes)
Flags field used for control and metadata

| Bit        | Meaning                      |
|------------|------------------------------|
| 0x00000001 | Record is deleted (`DELETED`)|
| 0x00000002 | Persistent                   |
| 0x00000004 | Initially disabled           |
| 0x00000008 | Ignored (null reference)     |
| 0x00000040 | Visible when distant         |
| 0x00000200 | Dangerous                    |
| 0x00000400 | Compressed                   |

## Bitmask Example
```cpp
bool is_deleted = flags & 0x00000001;
```
