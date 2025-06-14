# SPGD Record Structure (UESP)

*Source: [UESP - SPGD](https://en.uesp.net/wiki/Skyrim_Mod:Mod_File_Format/SPGD)*

| C | SubRecord | Name | Type/Size | Info |
| --- | --- | --- | --- | --- |
| + | EDID | editorId | zstring | Editor id |
| + | DATA | unknown | struct | 48-byte struct or 40 without ICON appears to be series of 4-byte values
Float - Gravity Velocity
Float - Rotation Velocity
Float - Particle Size X
Float - Particle Size Y
Float - Center Offset Min
Float - Center Offset Max
Float - Initial Rotation Range
uint32 - # of Subtextures X
uint32 - # of Subtextures Y
uint32 - Shader Type (In the CK Dust and Fog is set as Snow)
0 - Rain
1 - Snow
These bytes are not present when a Particle Texture (ICON) is not assigned.

uint32 - Box Size defaults to 4096
Float - Particle Density defaults to 1 |
| - | ICON | effects | zstring | Particle Texture - Path to .dds |

## Navigation menu

## Views

## Personal tools

## Search

## general

## Content

## Community

## Tools

