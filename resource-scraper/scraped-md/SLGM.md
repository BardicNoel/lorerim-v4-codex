# SLGM Record Structure (UESP)

*Source: [UESP - SLGM](https://en.uesp.net/wiki/Skyrim_Mod:Mod_File_Format/SLGM)*

| C | V | Field | Name | Type/Size | Info |
| --- | --- | --- | --- | --- | --- |
| + |  | EDID | editorID | zstring | Record Editor ID |
| + |  | OBND | objectBounds | OBND | Always 12 bytes even if all 0s |
| - | 40 | FULL | itemName | lstring | Full (in-game) name |
| + |  | MODL | model | zstring | Path to .nif |
| - |  | MODT | model data | struct[] | series of 12-byte structs (assume xyz) |
| - |  | KSIZ | numKeywords | KSIZ | KYWD Count. |
| - |  | KWDA | keywords | KWDA | [KYWD 0x000937A3] VendorItemSoulGem |
| + |  | SOUL | current soul | ubyte | Current soul value 0(none) - 5(grand) |
| + |  | DATA | data | struct | 8-byte struct
0-3 (uint32) base value
4-7 (float) weight |
| + |  | SLCP | soul capacity | ubyte | Capacity soul value 0(none) - 5(grand) |
| - |  | NAM0 | filled gem | formid | SLGM formid of filled gem. This is only used twice, once for an empty Grand and an empty Black Soul Gem which points to the appropriate filled soul gem. |
| * |  | ZNAM | sound | formid | found in Soul Gems Differ |

## Navigation menu

## Views

## Personal tools

## Search

## general

## Content

## Community

## Tools

