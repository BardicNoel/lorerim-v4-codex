# LCTN Record Structure (UESP)

*Source: [UESP - LCTN](https://en.uesp.net/wiki/Skyrim_Mod:Mod_File_Format/LCTN)*

| C | V | Field | Name | Type/Size | Info |
| --- | --- | --- | --- | --- | --- |
| + |  | EDID | editorID | zstring |  |
| - |  | ACPR/LCPR | population refs | struct[] | arbitrary total count of 12 byte struct
formID ACHR (actor reference)
formID CELL OR WRLD(0x3C=Tamriel)
int16/int16 ? |
| - |  | RCPR | population refs | formID[] | Actors - there is only one instance of this in the game data, in the Dawnguard version of MilitaryCampRiftImperialLocation |
| - |  | ACUN/LCUN | unique refs | struct[] | arbitrary total count of 12 byte struct
formID NPC_
formID ACHR (actor reference)
formID LCTN (points to itself in most cases) |
| - |  | ACSR/LCSR | static refs | struct[] | Location Ref Types - arbitrary total count of 16 byte struct
formID LCRT
formID REFR OR ACHR
formID CELL OR WRLD(0x3C=Tamriel)
int16/int16 ? |
| * |  | ACEC/LCEC | encounter? | struct | formID WRLD
followed by an arbritrary number of int16 pairs |
| - |  | ACEP/LCEP | enable points? | struct[] | arbitrary total count of 12 byte struct
formID ACHR
formID REFR
ubyte[4] additional data, varies significantly though first byte always 0x00 |
| - |  | ACID/LCID | unknown | formID[] | unknown |
| - |  | FULL | full name | lstring | Full (in-game) name |
| - |  | KSIZ | keyword count | KSIZ | Keyword count |
| - |  | KWDA | keywords | KWDA | Keywords array |
| - |  | PNAM | parent location | formID | Parent LCTN formID. |
| - |  | NAM1 | music | formID | MUSC formID. |
| - |  | FNAM | unknown | formID | Unreported Crime Faction |
| - |  | MNAM | marker | formID | World Location Marker Ref - reference REFR formID to a STAT |
| - |  | RNAM | unknown | float | World Location Radius |
| - |  | NAM0 | unknown | formID | Horse Marker Ref |
| - |  | CNAM | unknown | rgb | Color |

## Navigation menu

## Views

## Personal tools

## Search

## general

## Content

## Community

## Tools

