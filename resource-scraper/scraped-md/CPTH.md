# CPTH Record Structure (UESP)

*Source: [UESP - CPTH](https://en.uesp.net/wiki/Skyrim_Mod:Mod_File_Format/CPTH)*

| C | SubRecord | Name | Type/Size | Info |
| --- | --- | --- | --- | --- |
| + | EDID | editorId | zstring | Editor id |
| * | CTDA | objectBounds | CTDA | CTDA, presumably checks |
| - | CIS1 | ctda variable | zstring | eg. Is3rdPKillOnly |
| + | ANAM | unknown | formid[2] | Two formids that link camera paths. The first formid points to the parent camera path and the second formid points to a sibling camera path at the same level to create a tree structure as seen in the Camera Paths dialog in Creation Kit. |
| + | DATA | flags | byte | 0x01 |
| * | SNAM | cameras | formid | CAMS - do not line up with CTDA count |

## Navigation menu

## Views

## Personal tools

## Search

## general

## Content

## Community

## Tools

