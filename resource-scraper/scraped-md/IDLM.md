# IDLM Record Structure (UESP)

*Source: [UESP - IDLM](https://en.uesp.net/wiki/Skyrim_Mod:Mod_File_Format/IDLM)*

| C | SubRecord | Name | Type/Size | Info |
| --- | --- | --- | --- | --- |
| + | EDID | editorId | zstring | Editor id |
| + | OBND | object bounds | OBND | Always 12 bytes, even if all 0s |
| - | IDLF | flags | byte | Flags

0x01 0=Random 1=Run In Sequence
0x02 unused
0x04 Do once
0x08 unknown - editing form in CK sets the flag
0x10 Ignored By Sandbox |
| - | IDLC | idle count | byte | Total idle animation count for IDLA |
| - | IDLT | idle timer | float | Idle Timer Setting |
| - | IDLA | idle animations | formid[] | Series of IDLE formids, total count determined by IDLC |

## Navigation menu

## Views

## Personal tools

## Search

## general

## Content

## Community

## Tools

