# ALCH Record Structure (UESP)

*Source: [UESP - ALCH](https://en.uesp.net/wiki/Skyrim_Mod:Mod_File_Format/ALCH)*

| C | Field | Name | Type/Size | Info |
| --- | --- | --- | --- | --- |
| + | EDID | EditorID | zstring | Max 0x200 bytes, including null terminator. |
| + | OBND | ObjectBounds | OBND | Always 12 bytes even if all 0s |
| - | FULL | FullName | lstring | Full (in-game) name |
| - | KSIZ | KSIZ | uint32 | KYWD count |
| * | KWDA | KWDA | formid[KSIZ] | Array of KYWD formids |
| - | MODL | Model | MODL | Ground Model |
| - | ICON | Icon | zstring | Inventory icon filename |
| - | MICO | MessageIcon | zstring | Message icon filename |
| - | YNAM | PickupSound | formid | Pickup SNDR |
| - | ZNAM | DropSound | formid | Drop SNDR |
| + | DATA | Weight | float | Item weight |
| + | ENIT | EnchantedItem | struct | 20 bytes
uint32 Potion Value
uint32 Flags
0x00001 - ManualCalc
0x00002 - Food
0x10000 - Medicine
0x20000 - Poison
formid Addiction - Unknown use
dword AddictionChance
formid UseSound SNDR |
| * |  | Effects | Effect[] | One entry per effect. |
|  |  |  |  |  |
| + | EFID | EffectID | formid | Magic Effect MGEF |
| + | EFIT | EffectItem | struct | 12 bytes
float Magnitude
uint32 Area of Effect
uint32 Duration (0 = instant)
For auto-calc purposes, the game calculates the cost of an effect as:

effect_base_cost * (Magnitude * Duration / 10) ^ 1.1
A Magnitude < 1 is treated as 1, and a Duration of 0 as 10. |
| * | CTDA | Conditions | CTDA | Conditions on the effect. |

## Navigation menu

## Views

## Personal tools

## Search

## general

## Content

## Community

## Tools

