# MESG Record Structure (UESP)

*Source: [UESP - MESG](https://en.uesp.net/wiki/Skyrim_Mod:Mod_File_Format/MESG)*

| C | SubRecord | Name | Type/Size | Info |
| --- | --- | --- | --- | --- |
| + | EDID | editorId | zstring | Editor id |
| + | DESC | message text | lstring | actual text displayed |
| - | FULL | title | lstring | optional category name |
| - | INAM | unknown | uint32 | always 0 |
| - | QNAM | quest | formid | QUST formid |
| + | DNAM | flags | uint32 | Flags
0x01 - Message Box
0x02 - Auto-Display |
| - | TNAM | time | uint32 | Display Time (disabled by CK if Message Box flag is set) |
| * | CTDA | condition data | CTDA | related to ITXT |
| * | ITXT | response text | lstring | Response/Activation text (may be multiple) |

## Navigation menu

## Views

## Personal tools

## Search

## general

## Content

## Community

## Tools

