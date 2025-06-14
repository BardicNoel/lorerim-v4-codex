# BOOK Record Structure (UESP)

*Source: [UESP - BOOK](https://en.uesp.net/wiki/Skyrim_Mod:Mod_File_Format/BOOK)*

| C | Field | Name | Type/Size | Info |
| --- | --- | --- | --- | --- |
| + | EDID | editorID | zstring | Max 0x200 bytes, including null terminator. |
| - | VMAD | script data | VMAD | Script Data |
| + | OBND | objectBounds | OBND | 12 zeroes most of the time |
| - | FULL | ingame name | lstring | Full (in-game) name |
| + | MODL | model | MODL | Includes Fields MODB, MODT, MODS, MODD |
| - | ICON | Inventory Image | zstring | Inventory Image Filename |
| - | MICO | Message Icon | zstring | Message Icon Filename |
| + | DESC | description | lstring | Book Text |
| - | DEST | destruction data | DEST | Includes Fields DSTD, DMDL, DMDT, DMDS |
| - | YNAM | pickupSound | formid | Sound SNDR played when picked up |
| - | ZNAM | dropSound | formid | Sound SNDR played when dropped |
| + | KSIZ | KSIZ | uint32 | KYWD count |
| + | KWDA | KWDA | formid[KSIZ] | Array of KYWD formids |
| + | DATA | Book Data | struct | 16 Byte Struct
ubyte Flags
0x01 - Teaches Skill
0x02 - Can't be Taken
0x04 - Teaches Spell
0x08 - Read ([verification needed] not used in static game data, flag in save game data for already read books?)
ubyte Type ? ; alway 0 since SSE
0 - Book/Tome
255 - Note/Scroll ?
ubyte[2] - always 0
uint32 Teaches - Depends on the flag set
IF 0x01 Actor Value - Skill
IF 0x04 FormID - SPEL
uint32 - Value (In Gold)
float - Weight |
| - | INAM | Inventory Art | formid | Inventory Art STAT |
| + | CNAM | Description | lstring | Description (displayed at bottom in inventory view) |

## Navigation menu

## Views

## Personal tools

## Search

## general

## Content

## Community

## Tools

