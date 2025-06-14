# LGTM Record Structure (UESP)

*Source: [UESP - LGTM](https://en.uesp.net/wiki/Skyrim_Mod:Mod_File_Format/LGTM)*

| C | SubRecord | Name | Type/Size | Info |
| --- | --- | --- | --- | --- |
| + | EDID | editorId | zstring | Editor id |
| + | DATA | Lighting | struct | Lighting
rgb - Ambient Color
rgb - Directional Color
rgb - Fog Color Near
float - Fog Near
float - Fog Far
uint32 - Directional Rotation XY
uint32 - Directional Rotation Z
float - Directional Fade
float - Fog Clip Distance
float - Fog Power
uint32 - Unknown
uint32 - Unknown
uint32 - Unknown
uint32 - Unknown
uint32 - Unknown
uint32 - Unknown
uint32 - Unknown
uint32 - Unknown
rgb - Fog Color Far
float - Fog Max
float - Light Fade Start
float - Light Fade End
uint32 - Unknown |
| + | DALC | Direct Ambient and Specular Colors | Struct | Direct Ambient and Specular Colors
rgb - Directional Ambient X+
rgb - Directional Ambient X-
rgb - Directional Ambient Y+
rgb - Directional Ambient Y-
rgb - Directional Ambient Z+
rgb - Directional Ambient Z-
rgb - Specular Color
float - Fresnel Power (0-1) |

## Navigation menu

## Views

## Personal tools

## Search

## general

## Content

## Community

## Tools

