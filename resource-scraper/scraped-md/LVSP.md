# LVSP Record Structure (UESP)

*Source: [UESP - LVSP](https://en.uesp.net/wiki/Skyrim_Mod:Mod_File_Format/LVSP)*

| C | SubRecord | Name | Type/Size | Info |
| --- | --- | --- | --- | --- |
| + | EDID | EditorID | zstring |  |
| + | OBND | Bounds | Data (struct[12 bytes]) |  |
| + | LVLD | % Chance None | (byte) |  |
| + | LVLF | Level List Flags | (byte) | same as LVLI/LVLN? |
| + | LLCT | Count of LVLO subrecords | (byte) |  |
| + | LVLO | List Item | struct (12 bytes) | uint32  Level
formid SpellID
uint32  Count |

## Navigation menu

## Views

## Personal tools

## Search

## general

## Content

## Community

## Tools

