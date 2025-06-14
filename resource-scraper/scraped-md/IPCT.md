# IPCT Record Structure (UESP)

*Source: [UESP - IPCT](https://en.uesp.net/wiki/Skyrim_Mod:Mod_File_Format/IPCT)*

| C | SubRecord | Name | Type/Size | Info |
| --- | --- | --- | --- | --- |
| + | EDID | editorId | zstring | Editor ID |
| - | MODL | model | zstring | Path to .nif |
| - | MODT | model textures | MODT | series of 12-byte structs |
| + | DATA | data | struct | float  Effect Duration
uint32 flags?
float  Angle Treshold
float  Placement Radius
uint32 Sound Level
0x00000000 - Loud
0x00000001 - Normal
0x00000002 - Silent
0x00000003 - Very Loud
uint32 ??? |
| - | DODT | decal data | struct | float  Min Width
float  Max Width
float  Min Height
float  Max Height
float  Depth
float  Shininess
float  Parallax - Scale
uint8 Parallax - Passes
uint8[3] unknown
rgb  Color |
| - | DNAM | Texture Set | formID | Texture Set form ID (TXST). |
| - | ENAM | Secondary Texture Set | formID | Texture Set form ID (TXST). |
| - | SNAM | Impact Sound 1 | formID | Sound Descriptor form ID (SNDR). |
| - | NAM1 | Impact Sound 2 | formID | Sound Descriptor form ID (SNDR). |
| - | NAM2 | Effect Hazard | formID | Hazard form ID (HAZD). |

## Navigation menu

## Views

## Personal tools

## Search

## general

## Content

## Community

## Tools

