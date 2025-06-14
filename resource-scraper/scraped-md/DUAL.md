# DUAL Record Structure (UESP)

*Source: [UESP - DUAL](https://en.uesp.net/wiki/Skyrim_Mod:Mod_File_Format/DUAL)*

| C | SubRecord | Name | Type/Size | Info |
| --- | --- | --- | --- | --- |
| + | EDID | editorId | zstring | Editor id |
| + | OBND | object bounds | OBND | Object Bounds |
| + | DATA | unknown | struct | 24-byte struct
formID Projectile (PROJ)
formID Explosion (EXPL)
formID Effect Shader (EFSH)
formID Hit Effect Art (ARTO)
formID Impact Data Set (IPDS)
uint32 scale inheritance flags
0x01 - hit effect art inherits scale
0x02 - projectile inherits scale
0x04 - explosion inherits scale |

## Navigation menu

## Views

## Personal tools

## Search

## general

## Content

## Community

## Tools

