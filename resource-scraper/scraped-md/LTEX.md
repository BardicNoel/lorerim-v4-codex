# LTEX Record Structure (UESP)

*Source: [UESP - LTEX](https://en.uesp.net/wiki/Skyrim_Mod:Mod_File_Format/LTEX)*

| C | V | Field | Name | Type/Size | Info |
| --- | --- | --- | --- | --- | --- |
| + |  | EDID | Editor ID | zstring |  |
| - |  | TNAM | Texture | formid | Reference to a TXST. only 1 without this, LScrub01 |
| + |  | MNAM | Material | formid | Reference to a MATT. |
| + |  | HNAM |  | ubyte[2] | Havok Data
Friction
Restitution |
| + |  | SNAM |  | ubyte | Texture Specular Exponent always 0x1E (30) |
| * |  | GNAM | Grass | formid | Not required.  Possible Grass (GRAS) |

## Navigation menu

## Views

## Personal tools

## Search

## general

## Content

## Community

## Tools

