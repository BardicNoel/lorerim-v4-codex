# SHOU Record Structure (UESP)

*Source: [UESP - SHOU](https://en.uesp.net/wiki/Skyrim_Mod:Mod_File_Format/SHOU)*

| C | SubRecord | Name | Type/Size | Info |
| --- | --- | --- | --- | --- |
| + | EDID | editorId | zstring | Editor id |
| - | FULL | fullName | lstring | Full (in-game) name |
| + | MDOB | inventoryModel | formid | Model (STAT) shown in inventory |
| + | DESC | description | lstring | Description of the shout (0 if none). |
| * | SNAM | shoutData | struct | 12 bytes, Always 3 of these in each shout
formid - Word, Word of Power (WOOP)
formid - Spell, actual spell effect (SPEL)
float - Recovery Time, for player dragon shouts, this matches the (total) recharge time.  For non- this value is usually some small arbitrary number. |

## Navigation menu

## Views

## Personal tools

## Search

## general

## Content

## Community

## Tools

