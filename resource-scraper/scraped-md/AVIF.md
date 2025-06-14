# AVIF Record Structure (UESP)

*Source: [UESP - AVIF](https://en.uesp.net/wiki/Skyrim_Mod:Mod_File_Format/AVIF)*

| C | SubRecord | Name | Type/Size | Info |
| --- | --- | --- | --- | --- |
| + | EDID | editorId | zstring | Editor id |
| - | FULL | name | lstring | Full (in-game) name |
| + | DESC | description | lstring |  |
| - | ANAM | abbreviation | zstring | Only present on 1Hand/2Hand AV records |
| * | CNAM | data | uint32 | See below, if it has a perk tree: Skill category:
0 - None
1 - Combat
2 - Magic
3 - Stealth
if it's not then has large 4byte info (probably what is in the first 4 bytes of AVSK) |
| - | AVSK | av data? | float[4] | Only present for skills with groupings.
Skill Use Mult.
Skill Use Offset
Skill Improve Mult.
Skill Improve Offset |
| * |  | perk tree | Perk Sections[] | See below. |

## Perk Sections

| C | SubRecord | Name | Type/Size | Info |
| --- | --- | --- | --- | --- |
| + | PNAM | perk | formid | PERK formid, or 0 for the first |
| + | FNAM | flag? | dword | Most common values are 1 and 0. First perk of a tree has usually huge values. |
| + | XNAM | x-coord | dword | X Coordinate within the Perk-Grid |
| + | YNAM | y-coord | dword | Y Coordinate within the Perk-Grid |
| + | HNAM | horizontal position | float | Horizontal position of the Skill within the already via xnam/ynam set grid. |
| + | VNAM | vertical position | float | Vertical position of the Skill within the already via xnam/ynam set grid. |
| + | SNAM | skill | formid | AVIF formid, same one as parent usually.  Present whether or not CNAM is. |
| * | CNAM | connecting line | uint32 | ID (INAM field) of destination perk for each line coming from box, can be 0 or multiple |
| + | INAM | index number | uint32 | unique id for the perk box, not necessarily sequential |

## Navigation menu

## Views

## Personal tools

## Search

## general

## Content

## Community

## Tools

