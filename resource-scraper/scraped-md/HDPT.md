# HDPT Record Structure (UESP)

*Source: [UESP - HDPT](https://en.uesp.net/wiki/Skyrim_Mod:Mod_File_Format/HDPT)*

| C | SubRecord | Name | Type/Size | Info |
| --- | --- | --- | --- | --- |
| + | EDID | editorId | zstring | Editor id |
| - | FULL | name | lstring | name string, matches editor ID in most (not all) records |
| - | MODL | model | zstring | Models\ relative .nif |
| - | MODT | model texture data | MODT | model struct |
| + | DATA | flags | ubyte | flags:
0x00000001 Playable
0x00000002 Male
0x00000004 Female
0x00000008 Is Extra Part
0x00000010 Use Solid Tint |
| + | PNAM | Type | uint32 | Head part type:
0 Misc
1 Face
2 Eyes
3 Hair
4 Facial Hair
5 Scar
6 Eyebrows |
| * | HNAM | additional part | formid | Other HDPT formid attached (e.g. blind right eye to set of both) |
| + | NAM0 | option type | uint32 | values:
0x00 generic default?
0x01 default
0x02 chargen |
| + | NAM1 | .tri file | zstring | Path to .tri |
| - | TNAM | base texture | formid | TXST formid |
| - | RNAM | resource list | formid | Fixed List(FLST) formid |
| - | CNAM |  | formid | Color (seen in Dawnguard.esm) |

## Navigation menu

## Views

## Personal tools

## Search

## general

## Content

## Community

## Tools

