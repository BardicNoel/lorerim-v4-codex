# HAZD Record Structure (UESP)

*Source: [UESP - HAZD](https://en.uesp.net/wiki/Skyrim_Mod:Mod_File_Format/HAZD)*

| C | SubRecord | Name | Type/Size | Info |
| --- | --- | --- | --- | --- |
| + | EDID | editorId | zstring | Editor id |
| + | OBND | object bounds | OBND | Always 12 bytes even if all 0s |
| - | FULL | full name | lstring | Full (in-game) name |
| + | MODL | model | zstring | Path to .nif |
| - | MODT | model data | MODT | model textures |
| - | MNAM | unknown | formID | IS Mod |
| + | DATA | unknown | struct | 40-byte struct
uint32 Limit
float Radius
float Lifetime
float IS Radius
float Target Interval
uint32 flags
0x01 - Affects Player Only
0x02 - Inherit Duration from Spawn Spell
0x04 - Align to Impact Normal
0x08 - Inherit Radius from Spawn Spell
0x10 - Drop to Ground
formID Spell
formID Light
formID Impact Data Set
formID Sound |

## Notes

## Navigation menu

## Views

## Personal tools

## Search

## general

## Content

## Community

## Tools

