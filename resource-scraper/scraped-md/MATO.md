# MATO Record Structure (UESP)

*Source: [UESP - MATO](https://en.uesp.net/wiki/Skyrim_Mod:Mod_File_Format/MATO)*

| C | V | Field | Name | Type/Size | Info |
| --- | --- | --- | --- | --- | --- |
| + |  | EDID | Editor ID | zstring |  |
| - |  | MODL | model | zstring | path to .nif not present seems to = LOD |
| * |  | DNAM | Property Data | struct | Very large when present |
| + |  | DATA | unknown | struct | Usually 48 bytes, small number of 32/28
Float - Falloff Scale
Float - Falloff Bias
Float - Noise UV Scale
Float - Material UV Scale
Float - DirProjVector X
Float - DirProjVector Y
Float - DirProjVector Z
Float - Normal Dampener
Float - Single Pass Color R (this # x255)
Float - Single Pass Color G (this # x255)
Float - Single Pass Color B (this # x255)
uint32 - Single Pass (Boolean) |

## Navigation menu

## Views

## Personal tools

## Search

## general

## Content

## Community

## Tools

