# ACTI Record Structure (UESP)

*Source: [UESP - ACTI](https://en.uesp.net/wiki/Skyrim_Mod:Mod_File_Format/ACTI)*

| C | SubRecord | Name | Type/Size | Info |
| --- | --- | --- | --- | --- |
| + | EDID | editorId | zstring | Editor id |
| - | VMAD | script data | VMAD | Script Data |
| + | OBND | object bounds | OBND | Always 12 bytes, even if all 0s |
| - | FULL | ingame name | lstring | Full (in-game) name |
| - | MODL | model | MODL | Includes Fields MODB, MODT, MODS, MODD |
| - | DEST | destruction data | DEST | Includes Fields DSTD, DMDL, DMDT, DMDS, DSTF |
| - | KSIZ | count | uint32 | Number of formids in the following KWDA subrecord |
| - | KWDA | keywords | formID | Formid array of keywords |
| - | PNAM | Marker Color | rgb | Default Primitive Color
Red
Green
Blue
Unused - always 0x00 |
| - | SNAM | Sound - Looping | formID | FormID of SNDR nirnroot has the wow-wow sound here |
| - | VNAM | Sound - Activation | formID | FormID of SNDR when activated |
| - | WNAM | Water Type | formID | WATR rare |
| - | RNAM | Activate Text Override | lstring | Custom "verb" seen ingame when targeting the activator, e.g. 'Mine', 'Place', etc. |
| - | FNAM | Flags | uint16 | There are only two flags here.  The rest appear in the header.
0x01 = No Displacement (Associated with Water Type)
0x02 = Ignored by Sandbox |
| - | KNAM | Interaction Keyword | formID | KYWD formID for interaction purposes |

## Navigation menu

## Views

## Personal tools

## Search

## general

## Content

## Community

## Tools

