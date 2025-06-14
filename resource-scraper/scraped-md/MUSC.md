# MUSC Record Structure (UESP)

*Source: [UESP - MUSC](https://en.uesp.net/wiki/Skyrim_Mod:Mod_File_Format/MUSC)*

| C | SubRecord | Name | Type/Size | Info |
| --- | --- | --- | --- | --- |
| + | EDID | editorID | zstring | Editor ID |
| + | FNAM | flags | uint32 | Flags (bitfield)
0x01 - Plays One Selection
0x02 - Abrupt Transition
0x04 - Cycle Tracks
0x08 - Maintain Track Order (only allowed, if "Cycle Tracks" is set)
0x20 - Ducks Current Track |
| + | PNAM | data | struct | 4-byte struct
uint16 Priority (1 is highest priority, 100 is lowest priority)
uint16 Ducking, in dB; scaled by100, i.e. 126 means 1.26; allowed maximum is 10000, i.e. 100.00 |
| + | WNAM | fadeDuration | float | Fade Duration (seconds) |
| + | TNAM | music tracks | formid[] | Series of MUST form IDs, total count arbitrary |

## Navigation menu

## Views

## Personal tools

## Search

## general

## Content

## Community

## Tools

