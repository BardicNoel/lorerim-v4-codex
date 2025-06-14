# TXST Record Structure (UESP)

*Source: [UESP - TXST](https://en.uesp.net/wiki/Skyrim_Mod:Mod_File_Format/TXST)*

| C | SubRecord | Name | Type/Size | Info |
| --- | --- | --- | --- | --- |
| + | EDID | editorId | zstring | Editor id |
| + | OBND | unknown | ubyte[12] | Object Boundary
int16 - X1
int16 - Y1
int16 - Z1
int16 - X2
int16 - Y2
int16 - Z2 |
| + | TX00 | texture00 | zstring | texture path, color map |
| - | TX01 | texture01 | zstring | texture path, normal map (tangent- or model-space) |
| - | TX02 | texture02 | zstring | texture path, mask (environment or light) |
| - | TX03 | texture03 | zstring | texture path, tone map (for skins) or glow map (for things) |
| - | TX04 | texture04 | zstring | texture path, detail map (roughness, complexion, age) |
| - | TX05 | texture05 | zstring | texture path, environment map (cubemaps mostly) |
| - | TX06 | texture06 | zstring | texture path Multilayer (does not occur in Skyrim.esm) |
| - | TX07 | texture07 | zstring | texture path, specularity map (for skinny bodies, and for furry bodies) |
| - | DODT |  | struct | Decal Data
float - Min Width
float - Max Width
float - Min Height
float - Max Height
float - Depth
float - Shininess
float - Parallax Scale
ubyte - Parallax Passes
ubyte - Flags
0x01 - Parallax (enables the Scale and Passes values in the CK)
0x02 - Alpha Blending
0x04 - Alpha Testing
0x08 - not 4 Subtextures
ubyte[2] - unknown but not neverused
rgb - Color |
| + | DNAM |  | ushort | flags
0x01  - not Has specular map
0x02 - Facegen Textures
0x04 - Has model space normal map |

## Navigation menu

## Views

## Personal tools

## Search

## general

## Content

## Community

## Tools

