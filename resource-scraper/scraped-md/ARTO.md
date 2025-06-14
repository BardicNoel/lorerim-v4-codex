# ARTO Record Structure (UESP)

*Source: [UESP - ARTO](https://en.uesp.net/wiki/Skyrim_Mod:Mod_File_Format/ARTO)*

| C | SubRecord | Name | Type/Size | Info |
| --- | --- | --- | --- | --- |
| + | EDID | editorId | zstring | Editor id |
| + | OBND | object bounds | OBND | Always 12 bytes even if all 0s |
| - | MODL | model | MODL | Includes Fields MODB, MODT, MODS, MODD |
| + | DNAM | art type | uint32 | Enum
0x00000000 - Magic Casting
0x00000001 - Magic Hit Effect
0x00000002 - Enchantment Effect |

## Navigation menu

## Views

## Personal tools

## Search

## general

## Content

## Community

## Tools

