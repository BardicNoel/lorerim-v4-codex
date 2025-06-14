# AMMO Record Structure (UESP)

*Source: [UESP - AMMO](https://en.uesp.net/wiki/Skyrim_Mod:Mod_File_Format/AMMO)*

| C | Subrecord | Name | Type/Size | Info |
| --- | --- | --- | --- | --- |
| + | EDID | editorID | zstring | Record Editor ID |
| + | OBND | objectBounds | OBND | Always 12 bytes even if all 0s |
| - | FULL | itemName | lstring | Full item name (localized string) |
| - | MODL | model | zstring | World model filename |
| - | MODT | model data | struct[] | series of 12-byte structs (assume xyz) |
| - | ICON | Inventory Image | zstring | Inventory Image Filename |
| - | MICO | Message Immage | zstring | Message Immage Filename |
| - | DEST | destruction data | DEST | Includes Fields DSTD, DMDL, DMDT, DMDS |
| - | YNAM | pickupSound | formID | Sound(SNDR) played when picked up |
| - | ZNAM | dropSound | formID | Sound(SNDR) played when dropped |
| + | DESC | description | lstring |  |
| - | KSIZ | numKeywords | KSIZ | KYWD Count. |
| - | KWDA | keywords | KWDA | [KYWD 0x000917E7] VendorItemArrow, [KYWD 0x0010D501] WeapTypeBoundArrow |
| + | DATA | Data | struct | 16 byte struct
formID - Projectile ID PROJ
flags
0x00000001 - Ignores Normal Weapon Resistance
0x00000002 - Non-Playable
0x00000004 - Non-Bolt (Arrow/Bolt)
float - Damage
value - Item gold value
SSE version: 20 byte struct

formID - Projectile ID PROJ
flags
0x00000001 - Ignores Normal Weapon Resistance
0x00000002 - Non-Playable
0x00000004 - Non-Bolt (Arrow/Bolt)
float - Damage
value - Item gold value
float - Weight (always 0.1) |
| - | ONAM | Short Name | string | Short Name |

## Navigation menu

## Views

## Personal tools

## Search

## general

## Content

## Community

## Tools

