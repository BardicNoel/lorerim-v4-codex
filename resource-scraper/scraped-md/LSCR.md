# LSCR Record Structure (UESP)

*Source: [UESP - LSCR](https://en.uesp.net/wiki/Skyrim_Mod:Mod_File_Format/LSCR)*

| C | V | Field | Name | Type/Size | Info |
| --- | --- | --- | --- | --- | --- |
| + |  | EDID | Editor ID | zstring |  |
| + |  | DESC | displayed text | lstring | text displayed |
| * |  | CTDA | match conditions | CTDA | presumably for somewhat relevant screens |
| + |  | NNAM | loading screen NIF | formid | Static (STAT). |
| + |  | SNAM | initial scale | float | typical values roughly between 0.5 and 2 |
| + |  | RNAM | initial rotation | int16[3] | X, Y, and Z rotation |
| + |  | ONAM | rotation offset constraints | int16[2] | Min and Max rotation |
| + |  | XNAM | initial translation offset | float[3] | X, Y, and Z translation |
| - |  | MOD2 | camera path | zstring | path to Camera .nif |

## Navigation menu

## Views

## Personal tools

## Search

## general

## Content

## Community

## Tools

