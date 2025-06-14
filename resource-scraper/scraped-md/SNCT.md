# SNCT Record Structure (UESP)

*Source: [UESP - SNCT](https://en.uesp.net/wiki/Skyrim_Mod:Mod_File_Format/SNCT)*

| C | SubRecord | Name | Type/Size | Info |
| --- | --- | --- | --- | --- |
| + | EDID | editorId | zstring | Editor id |
| + | FULL | full name | lstring | Variable like $Master or name like EDID |
| + | FNAM | flags | uint32 | Flags
0x01 Mute When Submerged
0x02 Should Appear on Menu |
| - | PNAM | parent name | formid | Parent Category (SNCT) |
| + | VNAM | staticVolumeMult | uint16 | static volume multiplier - despite being an integer value, this represents a float. A value of zero maps to 0.0, a value of 65536 (0xFFFF) maps to 1.0, and all other values are mapped linearly.
(only 3 possible values - FF-FF (representing a float value of 1.0), 65-E6 (representing 0.9), 32-B3 (representing 0.7)) |
| - | UNAM | defaultMenuValue | uint16 | default menu value - see VNAM info, it uses the same "conversion" from integer to float values. Only present when "Should Appear on Menu" flag is set in FNAM subrecord. Otherwise it defaults to 1.0 (0xFFFF).
(only 3 possible values - FF-FF (representing 1.0), FF-7F (i.e. 0.5), CC-CC (0.8)) |

## Navigation menu

## Views

## Personal tools

## Search

## general

## Content

## Community

## Tools

