# LVLN Record Structure (UESP)

*Source: [UESP - LVLN](https://en.uesp.net/wiki/Skyrim_Mod:Mod_File_Format/LVLN)*

| C | SubRecord | Name | Type/Size | Info |
| --- | --- | --- | --- | --- |
| + | EDID | editorId | zstring | Editor id |
| + | OBND | objectBounds | OBND | Seems to always be 12 zeroes |
| + | LVLD | chanceNone | uint8 | Chance for an item on this list to not be spawned at all. Although present in records, it does not appear in the CK, and is always 0. |
| + | LVLF | flags | uint8 | Flags:
0x01=All levels (sets it to calculate for all entries < player level, choosing randomly from all the entries under)
0x02=Each (sets it to repeat a check every time the list is called (if it's called multiple times), otherwise it will use the same result for all counts.) |
| + | LLCT | listCount | uint8 | The number of entries in the list (the number of LVLO entries, essentially). |
| * | LVLO | level | uint32 | The level set for the entry; compared against a reference level determined by encounter zone, game setting multipliers, and player level. |
| formID | The NPC or LVLN used by the entry. |  |  |  |
| uint32 | How many enemies spawn (not editable in CK, always 1 in records) |  |  |  |
| COED | owner | COED | Can appear after each LVLO, only used once (LCharHagravenCompanion) |  |
| - | MODL | model | MODL | Editor Display Model (includes additional fields as specified on MODL page) |

## Navigation menu

## Views

## Personal tools

## Search

## general

## Content

## Community

## Tools

