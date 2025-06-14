# CELL Record Structure (UESP)

*Source: [UESP - CELL](https://en.uesp.net/wiki/Skyrim_Mod:Mod_File_Format/CELL)*

| C | Field | Type | Info |
| --- | --- | --- | --- |
| - | EDID | zstring | Cell editor ID |
| - | FULL | lstring | In game name of the cell. Only in interior cells. |
| + | DATA | uint16 | flags - Sometimes the field is only one byte long
0x0001 - Interior
0x0002 - Has Water
0x0004 - not Can't Travel From Here - only valid for interior cells
0x0008 - No LOD Water
0x0020 - Public Area
0x0040 - Hand Changed
0x0080 - Show Sky
0x0100 - Use Sky Lighting |
| - | XCLC | struct | (X, Y) grid location of the cell followed by flags. Always in exterior cells and never in interior cells.
int32 - X
int32 - Y
uint32 - flags (high bits look random)
0x1 - Force Hide Land Quad 1
0x2 - Force Hide Land Quad 2
0x4 - Force Hide Land Quad 3
0x8 - Force Hide Land Quad 4 |
| - | XCLL | struct | 92 byte structure - Lighting
rgb Ambient
rgb Directional
rgb Fog Near
float Fog Near
float Fog Far
int Rotation XY
int Rotation Z
float Directional Fade
float Fog Clip Dist
float Fog Pow
rgb Ambient X+
rgb Ambient X-
rgb Ambient Y+
rgb Ambient Y-
rgb Ambient Z+
rgb Ambient Z-
rgb Specular Color? not shown in CK - assumed from LGTM
float Fresnel Power? not shown in CK, usually 1 - assumed from LGTM
rgb Fog Far
float Fog Max
float Light Fade Distances Start
float Light Fade Distances End
uint32 Inherit flags - controls which parts are inherited from Lighting Template
0x0001 - Ambient Color
0x0002 - Directional Color
0x0004 - Fog Color
0x0008 - Fog Near
0x0010 - Fog Far
0x0020 - Directional Rot
0x0040 - Directional Fade
0x0080 - Clip Distance
0x0100 - Fog Power
0x0200 - Fog Max
0x0400 - Light Fade Distances
this field has only 64 bytes in NavMeshGenCellDUPLICATE001 |
| - | TVDT | 684 bytes |  |
| - | MHDT | 1028 bytes |  |
| - | XCGD | struct | Only found in Xbox360 and PS3 official DLC, not supported by CK 1.8.151.0.
uint32 - Count of substructures? Seems plausible, but doesn't always seem to match up.
uint32 - String length, including null-terminator (like bzstring, but with a uint32 length)
char[String length] - File name (looks to always be .nif files)
? - Other data here, but unclear what it is or what delineates the next file. |
| + | LTMP | formID | The lighting template for this cell. |
| - | LNAM | 4 bytes |  |
| + | XCLW | float | Non-ocean water-height in cell, is used for rivers, ponds etc., ocean-water is globally defined elsewhere.
0x7F7FFFFF reserved as ID for "no water present", it is also the maximum positive float.
0x4F7FFFC9 is a bug in the CK, this is the maximum unsigned integer 2^32-1 cast to a float and means the same as above
0xCF000000 could be a bug as well, this is the maximum signed negative integer -2^31 cast to a float |
| - | XNAM | 1 byte |  |
| - | XCLR | formID[] | Regions containing the cell (assumed from Oblivion). |
| Fields below this line can appear in any order. |  |  |  |
| - | XLCN | formID | The location for (of?) this cell. |
| - | XWCS | uint32 | Size of XWCU/16 - CK changes this into use of XWCN Always has the value three in Skyrim.esm. |
| - | XWCN | uint32 | Size of XWCU/16 Only one occurrence - 0x04 |
| - | XWCU | struct[] | Water Current, series of 16 byte structures, minimum 3
float X
float Y
float Z
float? unknown
Unclear how structures are matched up to "Linear Velocity" and "Angular Velocity" shown in CK |
| - | XCWT | formID | The water for (of?) this cell. |
| - | XOWN | formID | Owner NPC or Faction (assumed from Oblivion). Only in interior cells. |
| - | XILL | formID | ID of an NPC_ or FLST. Only in interior cells. |
| - | XWEM | zstring | Water Environment Map only interior cells |
| - | XCCM | formID | Climate if interior cell behaves like exterior cell (assumed from Oblivion). Only in interior cells. |
| - | XCAS | formID | The acoustic space for this cell. |
| - | XEZN | formID | A reference to an encounter zone. |
| - | XCMO | formID | The music type for this cell. |
| - | XCIM | formID | The image space for this cell. |

| Count | Value |
| --- | --- |
| 100 | 53bd00 |
| 279 | 53ba00 |
| 360 | 53d400 |
| 586 | 0 |
| 586 | 53d200 |
| 5881 | 53fd00 |
| 8397 | 53d100 |

## Navigation menu

## Views

## Personal tools

## Search

## general

## Content

## Community

## Tools

