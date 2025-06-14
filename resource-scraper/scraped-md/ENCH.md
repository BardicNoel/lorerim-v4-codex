# ENCH Record Structure (UESP)

*Source: [UESP - ENCH](https://en.uesp.net/wiki/Skyrim_Mod:Mod_File_Format/ENCH)*

| C | Field | Name | Type/Size | Info |
| --- | --- | --- | --- | --- |
| + | EDID | EditorID | zstring | Max 0x200 bytes, including null terminator. |
| + | OBND | ObjectBounds | OBND | Always 12 bytes even if all 0s |
| - | FULL | FullName | lstring | Full (in-game) name |
| + | ENIT | EnchantedItem | struct | 36 bytes (Version 37 has 32 bytes, omits the last formid for non-base)
uint32 - Enchantment Cost
uint32 - Flags
0x01 - ManualCalc
0x04 - ExtendDurationOnRecast
uint32 - CastType
0x00 - Constant Effect
0x01 - Fire and Forget
0x02 - Concentration
uint32 - Ench Amount - Fully charged value (same if no charges)
uint32 - Delivery
0x00 - Self
0x01 - Touch
0x02 - Aimed
0x03 - Target Actor
0x04 - Target Location
uint32 - EnchantType
0x06 = Enchantment
0x0C = Staff Enchantment
float - Charge Time, typically 0.5-1 where used
formid - Base Enchantment
formid - Worn Restrictions - FLST of enchantable slots (only base enchantments) |
| * |  | Effects | Effect[] | One entry per effect. |
|  |  |  |  |  |
| + | EFID | EffectID | formid | Magic Effect MGEF |
| + | EFIT | EffectItem | struct | 12 bytes
float Magnitude
uint32 Area of Effect
uint32 Duration (0 = instant)
For auto-calc purposes, the game calculates the cost of an effect as:

effect_base_cost * (Magnitude * Duration / 10) ^ 1.1
A Magnitude < 1 is treated as 1, and a Duration of 0 as 10. Any additional taper duration is not figured into the calculation. |
| * | CTDA | Conditions | CTDA | Conditions on the effect. |

## Navigation menu

## Views

## Personal tools

## Search

## general

## Content

## Community

## Tools

