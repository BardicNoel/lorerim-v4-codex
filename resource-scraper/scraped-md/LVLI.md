# LVLI Record Structure (UESP)

*Source: [UESP - LVLI](https://en.uesp.net/wiki/Skyrim_Mod:Mod_File_Format/LVLI)*

| C | SubRecord | Name | Type/Size | Info |
| --- | --- | --- | --- | --- |
| + | EDID | editorId | zstring | Editor id |
| + | OBND | objectBounds | OBND | Always all zeroes. |
| + | LVLD | unknown | int8 | Chance for an item on this list to not be spawned at all (for example, 75 means there's a 25% to spawn an item). |
| + | LVLF | unknown | int8 | Flags:
0x01=All levels (sets it to calculate for all entries < player level, choosing randomly from all the entries under)
0x02=Each (sets it to repeat a check every time the list is called (if it's called multiple times), otherwise it will use the same result for all counts.)
0x04=Use all (use all entries when the list is called)
0x08=Special loot |
| - | LVLG | Global | formID | Points to a global record. If this is set, the value of the global is used instead of LVLD for chance none. |
| - | LLCT | unknown | int8 | The number of entries in the list (the number of LVLO entries, essentially). |
| * | LVLO | level | uint32 | The level set for the entry. Reference level appears to be set by player level only? Affected by level scaling multipliers? |
| formID | The item or LVLI used by the entry. |  |  |  |
| uint32 | How many items are added or used when this list is called. |  |  |  |

## Navigation menu

## Views

## Personal tools

## Search

## general

## Content

## Community

## Tools

