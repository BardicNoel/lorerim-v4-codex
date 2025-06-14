# WATR Record Structure (UESP)

*Source: [UESP - WATR](https://en.uesp.net/wiki/Skyrim_Mod:Mod_File_Format/WATR)*

| C | SubRecord | Name | Type/Size | Info |
| --- | --- | --- | --- | --- |
| + | EDID | editorId | zstring | Editor id |
| - | FULL | unknown | lstring | Name |
| + | ANAM | unknown | uint8 | Opacity |
| + | FNAM | unknown | uint8 | flags
0x1 - Causes damage |
| - | MNAM | unknown | uint8 | (always 0 in Skyrim.esm, not used in newer files) |
| - | XNAM | unknown | formID | Spell effect (not found in original .esm files) |
| - | SNAM | unknown | formID | Open Sound |
| - | INAM | unknown | formID | Imagespace Modifier |
| - | TNAM | unknown | formID | Material |
| + | DATA | unknown | uint16 | damage per second (always 0 in original .esm files) |
| + | DNAM | unknown | struct | Original Skyrim always 228 bytes struct, in SSE 228 or 232 bytes
float?
float?
float?
float?
float - Sun Specular Power
float - Reflectivity Amount
float - Fresnel Amount
float?
float - Above Water: Fog Distance - Near Plane
float - Above Water: Fog Distance - Far Plane
-

rgb - Shallow Color
rgb - Deep Color
rgb - Reflection Color
float?
float?
float?
float?
float?
float - Displacement Starting Size
float - Displacement Force
-

float - Displacement Velocity
float - Displacement Falloff
float - Displacement Dampner
float?
float - Noise Falloff
float - Wind Direction Layer 1
float - Wind Direction Layer 2
float - Wind Direction Layer 3
float - Wind Speed Layer 1
float - Wind Speed Layer 2
-

float - Wind Speed Layer 3
float?
float?
float - Above Water: Fog Amount
float?
float - Under Water: Fog Amount
float - Under Water: Fog Distance - Near Plane
float - Under Water: Fog Distance - Far Plane
float - Refraction Magnitude
float - Specular Power
-

float?
float - Specular Radius
float - Specular Brightness
float - UV Scale Layer 1
float - UV Scale Layer 2
float - UV Scale Layer 3
float - Amplitude Scale Layer 1
float - Amplitude Scale Layer 2
float - Amplitude Scale Layer 3
float - Reflection Magnitude
-

float - Sun Sparkle Magnitude
float - Sun Specular Magnitude
float - Reflections
float - Refraction
float - Normals
float - Specular Lighting
float - Sun Sparkle Power |
| + | GNAM | unknown | ubyte[12] | unknown - always 0 |
| - | NAM0 | unknown | float[3] | Linear Velocity X, Y, Z |
| - | NAM1 | unknown | float[3] | Angular Velocity X, Y, Z |
| - | NNAM/NAM2 | unknown | zstring | Layer 1 Noise texture (Skyrim.esm uses 1st NNAM) |
| - | NNAM/NAM3 | unknown | zstring | Layer 2 Noise texture (Skyrim.esm uses 2nd NNAM) |
| - | NNAM/NAM4 | unknown | zstring | Layer 3 Noise texture (Skyrim.esm uses 3rd NNAM) |

## Navigation menu

## Views

## Personal tools

## Search

## general

## Content

## Community

## Tools

