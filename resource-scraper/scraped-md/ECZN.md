# ECZN Record Structure (UESP)

*Source: [UESP - ECZN](https://en.uesp.net/wiki/Skyrim_Mod:Mod_File_Format/ECZN)*

| C | Field | Name | Type/Size | Info |
| --- | --- | --- | --- | --- |
| + | EDID | editorId | zstring | Editor id |
| + | DATA | data | struct[12] | 2 Records have length 8 instead of 12, but those 2 records are all zero |
| owner ID | formID | Owner (NPC_ or FACT) |  |  |
| location | formID | Associated location (LCTN) |  |  |
| owner rank | int8 | Required rank in faction for ownership (either 0 or -1 used if no faction provided) |  |  |
| min level | uint8 | Minimum level |  |  |
| flags | uint8 | Flags:
0x00 = Never Resets
0x01 = Match PC Below Minimum Level
0x02 = Disable Combat Boundary |  |  |
| max level | uint8 | Maximum level |  |  |

## Navigation menu

## Views

## Personal tools

## Search

## general

## Content

## Community

## Tools

