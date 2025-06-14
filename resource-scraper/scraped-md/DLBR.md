# DLBR Record Structure (UESP)

*Source: [UESP - DLBR](https://en.uesp.net/wiki/Skyrim_Mod:Mod_File_Format/DLBR)*

| C | Field | Name | Type/Size | Info |
| --- | --- | --- | --- | --- |
| + | EDID | Editor ID | zstring |  |
| + | QNAM | Parent Quest | formid | Reference to the QUST record to which the dialogue branch belongs. |
| + | TNAM | Unknown | uint32 | Dialogue Tab
0 = Player Dialogue
1 = Persuasion (Character, Filtered Dialogue form) / Favor Dialogue (Quest form) |
| + | DNAM | Flags | uint32 | Bits 0-1:
0 = Normal
1 = Top-Level
2 = Blocking
Bit 2: Exclusive |
| + | SNAM | Start Dialogue | formid | Reference to a DIAL. |

## Navigation menu

## Views

## Personal tools

## Search

## general

## Content

## Community

## Tools

