# APPA Record Structure (UESP)

*Source: [UESP - APPA](https://en.uesp.net/wiki/Skyrim_Mod:Mod_File_Format/APPA)*

| C | SubRecord | Name | Type/Size | Info |
| --- | --- | --- | --- | --- |
| + | EDID | editorId | zstring | Editor id |
| - | VMAD | script info | VMAD | scripting info |
| + | OBND | object Bounds | OBND | Object Bounds Data |
| + | FULL | name | lstring | Full (in-game) name |
| - | MODL | model | zstring | World model filename |
| - | MODT | model data | struct[] | series of 12-byte structs (assume xyz) |
| - | ICON | Inventory Image | zstring | Inventory Image Filename |
| - | MICO | Message Immage | zstring | Message Immage Filename |
| - | DEST | destruction data | DEST | Includes optionl fields DSTD, DMDL, DMDT, DMDS |
| - | YNAM | pickupSound | formid | Sound(SNDR) played when picked up |
| - | ZNAM | dropSound | formid | Sound(SNDR) played when dropped |
| + | QUAL | quality | uint32 | quality of the apparatus: Lookup
0 = novice
1 = apprentice
2 = journeyman
3 = Expert
4 = Master |
| + | DESC | description | lstring | This is normally undefined |
| + | DATA | data | struct | 8 Byte Struct values are not shown in-game
uint32 : Value (In Gold)
float : Weight |

## Navigation menu

## Views

## Personal tools

## Search

## general

## Content

## Community

## Tools

