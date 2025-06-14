# TREE Record Structure (UESP)

*Source: [UESP - TREE](https://en.uesp.net/wiki/Skyrim_Mod:Mod_File_Format/TREE)*

| C | SubRecord | Name | Type/Size | Info |
| --- | --- | --- | --- | --- |
| + | EDID | editorId | zstring | Editor id |
| + | OBND | object bounds | OBND | Object Bounds |
| + | MODL | model | MODL | Includes Fields MODT |
| - | PFIG | result item | formID | FormID of INGR/ALCH |
| - | SNAM | use sound | formID | FormID of SNDR when activated |
| + | PFPC | percent chance? | ubyte[4] | Always 0, unless PFIG present then always 64-64-64-64 (100) |
| - | FULL | ingame name | lstring | Full (in-game) name |
| + | CNAM | data | struct | float - Trunk Flexibility
float - Branch Flexibility
float[8] ?
float - Leaf Amplitude
float - Leaf Frequency |

## Navigation menu

## Views

## Personal tools

## Search

## general

## Content

## Community

## Tools

