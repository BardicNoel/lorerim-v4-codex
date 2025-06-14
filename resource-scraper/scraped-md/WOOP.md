# WOOP Record Structure (UESP)

*Source: [UESP - WOOP](https://en.uesp.net/wiki/Skyrim_Mod:Mod_File_Format/WOOP)*

| C | SubRecord | Type/Size | Info |
| --- | --- | --- | --- |
| + | EDID | zstring | Editor Id |
| - | FULL | lstring | The record name. For standard words of power (ones accessible by the player), the name of the record is the dragon language name of the word (using numbers to represent vowel combinations, as done in Bethesda's dragon font). For example 'B4' is Bah (which can also be figured out looking at the edid, which spells out the word instead of using dragon font codes). |
| + | TNAM | lstring | Translation of word into localized language. Although this record always exists, in several cases it is an empty record. |

## Navigation menu

## Views

## Personal tools

## Search

## general

## Content

## Community

## Tools

