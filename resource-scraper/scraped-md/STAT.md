# STAT Record Structure (UESP)

*Source: [UESP - STAT](https://en.uesp.net/wiki/Skyrim_Mod:Mod_File_Format/STAT)*

| C | SubRecord | Name | Type/Size | Info |
| --- | --- | --- | --- | --- |
| + | EDID | editorId | zstring | Editor id |
| + | OBND | object bounds | OBND | Object Bounds |
| - | MODL | model | MODL | Includes Fields MODT, MODS |
| + | DNAM | data | struct | 8 byte structure
float  MaxAngle 30-120 degrees
formID Directional Material - MATO formID |
| - | MNAM | LOD Data | struct | 1040 byte structur present if the "HasDistanceLOD" flag is set. There is a lot of "junk" data after nul terminated strings (this seems to be confirmed by manually setting all data between strings to 0x00). The first empty string represents the lowest level detail model (i.e., if LODModel2 is empty then 3/4 should be as well).
char[260] LODModel1   HighDetail
char[260] LODModel2
char[260] LODModel3
char[260] LODModel4   LowDetail |

## Navigation menu

## Views

## Personal tools

## Search

## general

## Content

## Community

## Tools

