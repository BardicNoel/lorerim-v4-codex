# KYWD Record Structure (UESP)

*Source: [UESP - KYWD](https://en.uesp.net/wiki/Skyrim_Mod:Mod_File_Format/KYWD)*

## KYWD

| C | V | Field | Name | Type/Size | Info |
| --- | --- | --- | --- | --- | --- |
| + |  | EDID | editorID | zstring | Max 0x200 bytes, including null terminator. |
| - |  | CNAM | color | rgb | Used to identify keywords in the editor. |

## Including Keywords

| C | V | Field | Name | Type/Size | Info |
| --- | --- | --- | --- | --- | --- |
| + |  | KSIZ | KYWD count | uint32 | Total number of keywords. |
| + |  | KWDA | KYWD formids | formid[] | End-to-end KYWD formids, numbering KSIZ uint32 in total. |

## Navigation menu

## Views

## Personal tools

## Search

## general

## Content

## Community

## Tools

