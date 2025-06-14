# GRAS Record Structure (UESP)

*Source: [UESP - GRAS](https://en.uesp.net/wiki/Skyrim_Mod:Mod_File_Format/GRAS)*

| C | SubRecord | Name | Type/Size | Info |
| --- | --- | --- | --- | --- |
| + | EDID | editorId | zstring | Editor id |
| + | OBND | object bounds | OBND | Object Bounds |
| + | MODL | model | MODL | Includes Field MODT |
| + | DATA | unknown | struct | uint8 Density
uint8 Min Slope
uint8 Max Slope
uint8 unused
uint16 Distance from water
uint16 unused
uint32 How water distance is applied
1 Above - At Least
2 Above - At Most
3 Below - At Least
4 Below - At Most
5 Either - At Least
6 Either - At Most
7 Either - At Most Above
8 Either - At Most Below
float Position Range
float Height Range
float Color Range
float Wave Period
uint8 Flags
0x01 Vertex Lighting
0x02 Uniform Scaling
0x04 Fit to Slope
uint8 unused
uint16 unused |

## Navigation menu

## Views

## Personal tools

## Search

## general

## Content

## Community

## Tools

