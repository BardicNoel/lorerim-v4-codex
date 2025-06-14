# FLOR Record Structure (UESP)

*Source: [UESP - FLOR](https://en.uesp.net/wiki/Skyrim_Mod:Mod_File_Format/FLOR)*

| C | SubRecord | Name | Type/Size | Info |
| --- | --- | --- | --- | --- |
| + | EDID | editorId | zstring | Editor id |
| - | VMAD | script data | VMAD | Script Data |
| + | OBND | object bounds | OBND | Object Bounds |
| + | FULL | ingame name | lstring | Full (in-game) name |
| + | MODL | model | MODL | Includes Fields MODB, MODT, MODS, MODD |
| - | DEST | destruction data | DEST | Includes Fields DSTD, DMDL, DMDT, DMDS |
| - | KSIZ | count | dword | Number of formids in the following KWDA subrecord |
| - | KWDA | keywords | formid | Formid array of keywords |
| + | PNAM | unknown | uint32? | 4 bytes, always 0 |
| - | RNAM | verb string | lstring | Activate Text Override.  The verb seen ingame, eg RNAM = 'Catch' and FULL = 'Salmon' |
| + | FNAM | flags? | uint16? | 2 bytes, always 0 |
| - | PFIG | Ingredient | formid | Formid of INGR/ALCH received |
| - | SNAM | Pickup sound | formid | Formid of SNDR when activated |
| + | PFPC | percent chance | uint32 | Seasonal Harvest Percent Change
byte - Spring
byte - Summer
byte - Fall
byte - Winter |

## Navigation menu

## Views

## Personal tools

## Search

## general

## Content

## Community

## Tools

