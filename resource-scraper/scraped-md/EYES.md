# EYES Record Structure (UESP)

*Source: [UESP - EYES](https://en.uesp.net/wiki/Skyrim_Mod:Mod_File_Format/EYES)*

| C | SubRecord | Name | Type/Size | Info |
| --- | --- | --- | --- | --- |
| + | EDID | editorId | zstring | Editor id |
| + | FULL | description | lstring |  |
| + | ICON | path | zstring | Textures\ relative path to .dds |
| + | DATA | type | Flags/Byte | Value
Meaning


0x01
Playable


0x02
Not Male


0x04
Not Female |
|  |  |  |  |  |
| 0x01 | Playable |  |  |  |
| 0x02 | Not Male |  |  |  |
| 0x04 | Not Female |  |  |  |

| Value | Meaning |
| --- | --- |
| 0x01 | Playable |
| 0x02 | Not Male |
| 0x04 | Not Female |

## Navigation menu

## Views

## Personal tools

## Search

## general

## Content

## Community

## Tools

