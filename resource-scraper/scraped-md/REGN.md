# REGN Record Structure (UESP)

*Source: [UESP - REGN](https://en.uesp.net/wiki/Skyrim_Mod:Mod_File_Format/REGN)*

| C | V | Field | Name | Type/Size | Info |
| --- | --- | --- | --- | --- | --- |
| + |  | EDID | Editor ID | zstring |  |
| + |  | RCLR | region color | rgb | Map Color (unknown where used) |
| - |  | WNAM | world name | formid | World (WRLD). |
| - |  | RPLI |  | uint32 | Edge Fall-off (World Units) |
| - |  | RPLD | data for "pl"? | struct[] | series of 8-byte structs, vary in length from 32 to 172 look like floats, coords? |
| - |  | RDAT | data header? | struct | 8-byte struct
uint32 Tab in CK
0x02 - Objects
0x03 - Weather
0x04 - Map
0x05 - Landscape (CK will save but not show data entered here)
0x06 - Grass
0x07 - Sound
uint8 Flags
0x01 - Override
uint8 Priority
uint16 always 0 |
| - |  | RDMO | music | formid | Music (MUSC) formid.  Can appear with RDSA under same RDAT or on its own. |
| - |  | RDSA | sound data | struct[] | 12-byte struct, total count arbitrary
formid - Sound Reference (SNDR)
uint32 - Flags
0x01 - Pleasant
0x02 - Cloudy
0x04 - Rainy
0x08 - Snowy
float - Chance |
| - |  | RDWT | weather data | struct[] | 12-byte struct, total count arbitrary
formid - Weather (WTHR)
uint32 - percent chance (all should add up to 100)
formid - Global (GLOB, not used) |
| - |  | RDOT | Region generator objects | struct[] | Used for region generation: always 0 length in game files.
52-byte struct, total count arbitrary. 

formid - object to be placed
int16 - Parent Index (-1 for none)
(2-bytes) - Unknown
float - Density
uint8 - Clustering
uint8 - Min Slope (degrees)
uint8 - Max Slope (degrees)
uint8 - Flags
0x01 - Conform to slope
0x02 - Paint Vertices
0x04 - Size Variance +/-
0x08 - x +/-
0x10 - y +/-
0x20 - z +/-
0x40 - Tree
0x80 - Huge Rock
uint16 - Radius wrt Parent
uint16 - Radius
float - Min Height
float - Max Height
float - Sink
float - Sink Variance
float - Size Variance
int16 x 3 - Angle Variance. x y z values: -180 to 180
(2-bytes) - Unknown
(3-bytes) - Vertex shading color RGB
uint8 - Shading radius ( 0 - 200) %
objects - vertex shading extent as % of object radius
textures - texture radius extent as % of parent object radius |
| - |  | ICON | shader? | zstring | path to .dds Trees\CanopyShadow.dds |
| - |  | RDMP | Region Name? | lstring | Map Name |

## Navigation menu

## Views

## Personal tools

## Search

## general

## Content

## Community

## Tools

