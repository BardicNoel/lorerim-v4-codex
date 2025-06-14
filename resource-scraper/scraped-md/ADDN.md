# ADDN Record Structure (UESP)

*Source: [UESP - ADDN](https://en.uesp.net/wiki/Skyrim_Mod:Mod_File_Format/ADDN)*

| C | SubRecord | Name | Type/Size | Info |
| --- | --- | --- | --- | --- |
| + | EDID | editorId | zstring | Editor id |
| + | OBND | object bounds | OBND | Always 12 bytes, even if all 0s |
| + | MODL | model | zstring | Path to .nif |
| + | MODT | model data | struct[] | series of 12-byte structs (assume xyz) |
| + | DATA | Addon Node Index | uint32 | Unique integer (within ADDN), may be used instead of formID for reference. |
| - | SNAM | Ambient Sound | FormID | SOUN not found in original files |
| + | DNAM | flags | struct | uint16 - Master Particle System Cap always 0 in original files
uint16 - Flags
0x0001 : unknown, always set in original files
0x0002 : Always Loaded - Camera?  dust spray//blood spray//fire impact (but not frost) |

## Navigation menu

## Views

## Personal tools

## Search

## general

## Content

## Community

## Tools

