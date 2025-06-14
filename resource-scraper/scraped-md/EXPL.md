# EXPL Record Structure (UESP)

*Source: [UESP - EXPL](https://en.uesp.net/wiki/Skyrim_Mod:Mod_File_Format/EXPL)*

| C | SubRecord | Name | Type/Size | Info |
| --- | --- | --- | --- | --- |
| + | EDID | editorId | zstring | Editor id |
| + | OBND | object bounds | OBND | Always 12 bytes, even if all 0s. |
| - | FULL | full name | lstring | Full(in-game) name |
| - | MODL | model | zstring | Path to .nif |
| - | MODT | model data | struct[] | series of 12-byte structs (assume xyz) |
| - | EITM | enchantment | formid | Enchantment  (ENCH) formid |
| - | MNAM | modifier | formid | Image Space Modifier (IMAD) formid |
| + | DATA | data | struct | 52 bytes  exceptions: FXEmptyObject.nif, 48 w/ EITM, 44 w/o, spider/dragon projectiles 40 w/ 0s OBND |

## Navigation menu

## Views

## Personal tools

## Search

## general

## Content

## Community

## Tools

