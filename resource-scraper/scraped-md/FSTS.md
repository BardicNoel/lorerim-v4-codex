# FSTS Record Structure (UESP)

*Source: [UESP - FSTS](https://en.uesp.net/wiki/Skyrim_Mod:Mod_File_Format/FSTS)*

| C | SubRecord | Name | Type/Size | Info |
| --- | --- | --- | --- | --- |
| + | EDID | editorId | zstring | Editor id |
| + | XCNT | set count | struct | 20 byte struct
uint32 count of walking set
uint32 count of running set
uint32 count of sprinting set
uint32 count of sneaking set
uint32 count of swimming set |
| + | DATA | footstep sets | formid[] | End-to-end FSTP formids, total count = sum of XCNT sections. |

## Navigation menu

## Views

## Personal tools

## Search

## general

## Content

## Community

## Tools

