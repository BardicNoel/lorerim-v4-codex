# INGR Record Structure (UESP)

*Source: [UESP - INGR](https://en.uesp.net/wiki/Skyrim_Mod:Mod_File_Format/INGR)*

| C | Field | Name | Type/Size | Info |
| --- | --- | --- | --- | --- |
| + | EDID | EditorID | zstring | Max 0x200 bytes, including null terminator. |
| - | VMAD | ScriptInfo | VMAD | Papyrus script data. (In main game files, this is only used for Briarhearts.) |
| + | OBND | ObjectBounds | OBND | Always 12 bytes even if all 0s |
| + | FULL | FullName | lstring | Full (in-game) name |
| - | KSIZ | KSIZ | uint32 | KYWD count |
| - | KWDA | KWDA | formid[KSIZ] | Array of KYWD formids |
| + | MODL | Model | MODL | Ground Model |
| - | ICON | Icon | zstring | Inventory icon filename |
| - | YNAM | PickupSound | formid | Pickup SNDR |
| - | ZNAM | DropSound | formid | Drop SNDR |
| + | DATA | ItemData | struct | 8 bytes
uint32 Value
float Weight |
| + | ENIT | EnchantedItem | struct | 8 bytes
uint32 Ingredient Value - but all ingredients in the game data use autocalc
uint32 Flags
0x001 - ManualCalc
0x002 - Food
0x100 - References Persist |
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

