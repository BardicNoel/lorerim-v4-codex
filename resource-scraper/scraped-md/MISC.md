# MISC Record Structure (UESP)

*Source: [UESP - MISC](https://en.uesp.net/wiki/Skyrim_Mod:Mod_File_Format/MISC)*

| C | SubRecord | Name | Type/Size | Info |
| --- | --- | --- | --- | --- |
| + | EDID | editorId | zstring | Editor id |
| - | VMAD | script info | VMAD |  |
| + | OBND | objectBounds | OBND | Object Bounds Data |
| + | FULL | name | lstring | Full (in-game) name |
| - | MODL | model | MODL | Includes Fields MODB, MODT, MODS, MODD |
| - | ICON | Inventory Image | zstring | Inventory Image Filename |
| - | MICO | Message Immage | zstring | Message Immage Filename |
| - | DEST | destruction data | DEST | Includes Fields DSTD, DMDL, DMDT, DMDS, DSTF |
| - | YNAM | pickupSound | formid | Sound(SNDR) played when picked up |
| - | ZNAM | dropSound | formid | Sound(SNDR) played when dropped |
| - | KSIZ | count | unit32 | Number of formids in the following KWDA subrecord |
| - | KWDA | keywords | formid | Formid array of keywords |
| + | DATA | Value & Weight Data | struct | 8-Bytes For Value & Weight
uint32 - Value (In Gold)
float - Weight |

## Navigation menu

## Views

## Personal tools

## Search

## general

## Content

## Community

## Tools

