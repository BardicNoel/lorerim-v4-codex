# RFCT Record Structure (UESP)

*Source: [UESP - RFCT](https://en.uesp.net/wiki/Skyrim_Mod:Mod_File_Format/RFCT)*

| C | SubRecord | Name | Type/Size | Info |
| --- | --- | --- | --- | --- |
| + | EDID | editorID | zstring | editor ID |
| + | DATA | effect data | 12 bytes | struct
formID Effect Art (ARTO)
formID Shader (EFSH)
uint32 flags
0x01 - rotate to face target : Used when Attach To Camera is not set
0x02 - attach to camera
0x04 - inherit rotation : Used when Attach To Camera is set |

## Navigation menu

## Views

## Personal tools

## Search

## general

## Content

## Community

## Tools

