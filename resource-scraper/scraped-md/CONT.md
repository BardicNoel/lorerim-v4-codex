# CONT Record Structure (UESP)

*Source: [UESP - CONT](https://en.uesp.net/wiki/Skyrim_Mod:Mod_File_Format/CONT)*

| C | SubRecord | Name | Type/Size | Info |
| --- | --- | --- | --- | --- |
| + | EDID | editorId | zstring | Editor id |
| - | VMAD |  | VMAD | Script data |
| + | OBND | objectBounds | OBND | Object Bounds Data |
| - | FULL | full name | lstring | In-game name |
| - | MODL | model | MODL | Includes Fields MODT, MODS |
| - | COCT | object count | uint32 | Count of CNTO/COED subrecords |
| * | CNTO | container object | struct | 8 byte struct
formID item - object or leveled list
uint32 count |
| * | COED |  | COED | optional owner/health of item only one occurrence in game data |
| + | DATA | unknown | struct | uint8 - Flags

0x01 - Allow sounds when container animation exists
0x02 - Respawns
0x04 - Show Owner
float - weight mis-aligned, always 0 |
| - | SNAM | Open Sound | formID | (SNDR) |
| - | QNAM | Close Sound | formID | (SNDR) |

## Navigation menu

## Views

## Personal tools

## Search

## general

## Content

## Community

## Tools

