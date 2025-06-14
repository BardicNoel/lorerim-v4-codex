# TACT Record Structure (UESP)

*Source: [UESP - TACT](https://en.uesp.net/wiki/Skyrim_Mod:Mod_File_Format/TACT)*

| C | SubRecord | Name | Type/Size | Info |
| --- | --- | --- | --- | --- |
| + | EDID | editorId | zstring | Editor id |
| - | VMAD | unknown | VMAD | Scripting Info |
| + | OBND | objectBounds | OBND | Object bounds. |
| - | FULL | full name | lstring | Name seen ingame (if any) |
| - | MODL | model | MODL | Includes Fields MODB, MODT, MODS, MODD |
| - | DEST | destruction data | DEST | Includes Fields DSTD, DMDL, DMDT, DMDS |
| - | KSIZ | KSIZ | uint32 | KYWD count |
| - | KWDA | KWDA | formid[KSIZ] | Array of KYWD formids |
| - | PNAM | unknown |  | RESET to 0 by CK, assumed legacy |
| + | SNAM | Looping Sound | formid | Looping Sound |
| + | FNAM | Unknown |  | Unknown, assumed legacy |
| + | VNAM | Voice Type | formid | Voice Type (VTYP) |

## Navigation menu

## Views

## Personal tools

## Search

## general

## Content

## Community

## Tools

