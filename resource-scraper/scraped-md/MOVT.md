# MOVT Record Structure (UESP)

*Source: [UESP - MOVT](https://en.uesp.net/wiki/Skyrim_Mod:Mod_File_Format/MOVT)*

| C | SubRecord | Name | Type/Size | Info |
| --- | --- | --- | --- | --- |
| + | EDID | editorId | zstring | Editor id |
| + | MNAM | name | zstring | Simplified name (usually EDID minus the trailing _MT) |
| + | SPED | Default Data | struct | 44-byte struct or 40-byte struct if INAM not specified.
Float - Left Walk
Float - Left Run
Float - Right Walk
Float - Right Run
Float - Forward Walk
Float - Forward Run
Float - Back Walk
Float - Back Run
Float - Rotate in Place Walk
Float - Rotate in Place Run
Not present if INAM is not specified

Float - Rotate while Moving Run |
| - | INAM | Anim Change Thresholds | struct | 12-byte struct
Float - Directional - Scale: 57.296
Float - Movement Speed - Scale: 57.296
Float - Rotation Speed - Scale: 57.296 |

## Notes

## Navigation menu

## Views

## Personal tools

## Search

## general

## Content

## Community

## Tools

