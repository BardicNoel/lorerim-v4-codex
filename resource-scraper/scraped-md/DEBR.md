# DEBR Record Structure (UESP)

*Source: [UESP - DEBR](https://en.uesp.net/wiki/Skyrim_Mod:Mod_File_Format/DEBR)*

| C | SubRecord | Name | Type/Size | Info |
| --- | --- | --- | --- | --- |
| + | EDID | editorId | zstring | Editor id |
| * | DATA | directional data? | struct | struct - 42 bytes for IceForm (have MODT) and 45 for IceWraith (does not)
uint8 Percentage
zstring Model Path
uint8 Flags
0x01 - Has Collision Data |
| - | MODT | model data | MODT | 6 12-byte structs (assume xyz) |

## Navigation menu

## Views

## Personal tools

## Search

## general

## Content

## Community

## Tools

