# WRLD Record Structure (UESP)

*Source: [UESP - WRLD](https://en.uesp.net/wiki/Skyrim_Mod:Mod_File_Format/WRLD)*

| C | Field | Name | Type/Size | Info |
| --- | --- | --- | --- | --- |
| + | EDID | EditorID | zstring | The name of this worldspace used in the construction kit |
| * | RNAM | Large References | struct | (int16's are Cell Grid Coordinates, FormIDs are References that place a Base Object that is of Object Size 512 or greater.  Such Reference transition from Full Model to LOD at uGrids=11 instead of 5, by default)
int16[2]
uint32 - count of pairs following:
formID
int16[2] |
| - | MHDT | Max Height Data | ubyte[??] | 8 bytes for Mix/Max X/Y Cell Grid Coordinates followed by an Ordered Array of 4 byte structs, containing 4x 1 Byte Integers, 1  struct per cell, listing the Max Heights per quad in each cell.  4 Bytes are 00s if the cell the entry relates does not actually exist. |
| - | FULL | Name | lstring | The name of this worldspace used in the game |
| - | WCTR | Fixed Dimension Center Cell | int16[2] | X, Y |
| - | LTMP | Lighting Template | formID | Interior Lighting LGTM |
| - | XEZN | Encounter Zone | formID | Encounter Zone ECZN |
| - | XLCN | Location | formID | Location LCTN |
| - | CNAM | Climate | formID | CLMT reference. |
| - | NAM2 | Water Type | formID | Water WATR |
| - | NAM3 | LOD Water Type | formID | LOD water-type, always a WATR form ID |
| - | NAM4 | LOD Water Height | float | LOD oceanwater-level (-14000.0 for Tamriel) |
| - | DNAM | Land Data | float[2] | Default land- and oceanwater-levels (-27000 & -14000.0 for Tamriel) |
| - | MODL | cloud model | MODL | Cloud Model - Includes optional field MODT |
| - | MNAM | Map size | struct | 16 or 28 byte structure |
| width | uint32 | The usable width of the map |  |  |
| height | uint32 | The usable height of the map |  |  |
| NW cell X | int16 |  |  |  |
| NW cell Y | int16 |  |  |  |
| SE cell X | int16 |  |  |  |
| SE cell Y | int16 |  |  |  |
| Min Height | float | Camera Data (default 50000), new as of Skyrim 1.8, purpose is not yet known. |  |  |
| Max Height | float | Camera Data (default 80000) |  |  |
| Initial Pitch | float | Camera Data (default 50) |  |  |
| + | NAMA | unknown | float | Distant LOD Multiplier |
| - | DATA | flags | uint8 | Flags
0x01 - Small World
0x02 - Can't Fast Travel From Here
0x04
0x08 - No LOD Water
0x10 - No Landscape
0x20 - No Sky
0x40 - Fixed Dimensions
0x80 - No Grass |
| - | NAM0 | unknown | int32[2] | Coordinates for the bottom left corner of the worldspace (assumed from Oblivion) |
| - | NAM9 | unknown | int32[2] | Coordinates for the top right corner of the worldspace (assumed from Oblivion) |
| - | WNAM | Parent worldspace | formID | Form ID of the parent worldspace. |
| - | PNAM | unknown | uint16 | Use flags - Set if parts are inherited from parent worldspace WNAM
0x01 - Use Land Data (DNAM)
0x02 - Use LOD Data (NAM3, NAM4)
0x04 - Use Map Data (MNAM, MODL)
0x08 - Use Water Data (NAM2)
0x10 - unknown
0x20 - Use Climate Data (CNAM)
0x40 - Use Sky Cell |
| - | ONAM | unknown | float[4] | This field specifies where map markers will appear in relation to the parent
World Map Scale - -1=Hide Map Markers
Cell X Offset * 4096
Cell Y Offset * 4096
Cell Z Offset * 4096 |
| - | TNAM | HD LOD Diffuse | zstring | The name of a texture file. |
| - | UNAM | HD LOD Normal | zstring | The name of the normals file matching the TNAM. |
| + | ZNAM | music | formID | always a MUSC form ID |
| - | XWEM |  | zstring | Water Environment Map |
| - | OFST | Offsets | Array of 4 byte Integers | Contains an ordered array of Relative Absolute file offsets to each Cell record under the Worldspace.  4 bytes are all 00 if the cell the entry in the array relates to, is not present in the plugin in question.  When Present, the engine direct loads the Cell and its References from the Offset, instead of seeking down the Blocks/Sub-Blocks to find them.  Is Not a Rule-Of-One Sub-Record, nor does it Merge at Runtime, it is a "Local" sub-record unique to each plugin/override. |

## Navigation menu

## Views

## Personal tools

## Search

## general

## Content

## Community

## Tools

