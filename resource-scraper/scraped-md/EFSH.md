# EFSH Record Structure (UESP)

*Source: [UESP - EFSH](https://en.uesp.net/wiki/Skyrim_Mod:Mod_File_Format/EFSH)*

| C | SubRecord | Name | Type/Size | Info |
| --- | --- | --- | --- | --- |
| + | EDID | editorId | zstring | Editor id |
| + | ICON | start effect | zstring | Path to .dds |
| + | ICO2 | looped effect | zstring | Path to .dds |
| + | NAM7 | post effect | zstring | Path to .dds |
| - | NAM8 | looped gradient | zstring | Path to .dds |
| - | NAM9 | end gradient | zstring | Path to .dds |
| + | DATA | unknown | struct | shader data, size ranges from 308 to 400 bytes (always an integral multiple of 4 bytes) in Skyrim.esm |

## Navigation menu

## Views

## Personal tools

## Search

## general

## Content

## Community

## Tools

