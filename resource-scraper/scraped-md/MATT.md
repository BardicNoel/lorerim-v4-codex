# MATT Record Structure (UESP)

*Source: [UESP - MATT](https://en.uesp.net/wiki/Skyrim_Mod:Mod_File_Format/MATT)*

| C | V | Field | Name | Type/Size | Info |
| --- | --- | --- | --- | --- | --- |
| + |  | EDID | Editor ID | zstring |  |
| + |  | MNAM | Material Name | zstring |  |
| - |  | HNAM | Havok Impact Data Set | formid | references to a IPDS record |
| - |  | PNAM | Parent Material | formid | references to another MATT record |
| + |  | CNAM | Havok Display Color | float[3] | three floats in the range [0.0;1.0]; 0.0 is shown as 0 and 1.0 as 255 in the Creation Kit, floating point values are mapped linearly to [0;255]
values are for the red, green and blue components of the color, in that order |
| + |  | BNAM | Buoyancy | float | values in Skyrim.esm range from -1.0 to +1.0 |
| + |  | FNAM | flags | uint32 | flag bitfield
0x00000001 - Stair Material
0x00000002 - Arrows Stick |

## Navigation menu

## Views

## Personal tools

## Search

## general

## Content

## Community

## Tools

