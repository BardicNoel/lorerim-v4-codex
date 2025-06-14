# MSTT Record Structure (UESP)

*Source: [UESP - MSTT](https://en.uesp.net/wiki/Skyrim_Mod:Mod_File_Format/MSTT)*

| C | SubRecord | Name | Type/Size | Info |
| --- | --- | --- | --- | --- |
| + | EDID | editorId | zstring | Editor id |
| + | OBND | object bounds | OBND | Object Bounds |
| - | MODL | model | MODL | Includes Fields MODT, MODS, |
| - | DEST | destruction data | DEST | Includes Fields DSTD, DMDL, DMDT, DSTF |
| + | DATA | flags | uint8 | flags? values 0x00 through 0x03 |
| - | SNAM | looping sound | formID | Ambient Sound (SNDR) |

## Navigation menu

## Views

## Personal tools

## Search

## general

## Content

## Community

## Tools

