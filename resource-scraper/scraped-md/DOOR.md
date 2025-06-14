# DOOR Record Structure (UESP)

*Source: [UESP - DOOR](https://en.uesp.net/wiki/Skyrim_Mod:Mod_File_Format/DOOR)*

| C | SubRecord | Name | Type/Size | Info |
| --- | --- | --- | --- | --- |
| + | EDID | editorId | zstring | Editor id |
| - | VMAD | script data | VMAD | Script Data |
| + | OBND | objectBounds | OBND | Object Bounds Data |
| - | FULL | full name | lstring | In-game name |
| - | MODL | model | MODL | Includes Fields MODT, MODS |
| - | SNAM | Open Sound | formID | (SNDR) |
| - | ANAM | Close Sound | formID | (SNDR) |
| - | BNAM | Loop Sound | formID | (SNDR) |
| + | FNAM | Flags | uint8 | Door Flags
0x02 Automatic Door
0x04 Hidden
0x08 Minimal Use
0x10 Sliding Door
0x20 Do Not Open in Combat Search |
| * | TNAM | Random Teleports | formID | If present, a random destination from this list is picked the first time the door is used, then baked into the savegame. |

## Navigation menu

## Views

## Personal tools

## Search

## general

## Content

## Community

## Tools

