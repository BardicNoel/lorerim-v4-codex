# SPEL Record Structure (UESP)

*Source: [UESP - SPEL](https://en.uesp.net/wiki/Skyrim_Mod:Mod_File_Format/SPEL)*

| C | Field | Name | Type/Size | Info |
| --- | --- | --- | --- | --- |
| + | EDID | EditorID | zstring | Max 0x200 bytes, including null terminator. |
| + | OBND | ObjectBounds | OBND | Always 12 bytes even if all 0s |
| - | FULL | FullName | lstring | Full (in-game) name |
| - | MDOB | MenuIcon | formid | Menu display object STAT |
| + | ETYP | EquipType | formid | Equip slot EQUP |
| + | DESC | Description | lstring | In-game description or 0 if none. |
| + | SPIT | SpellItem | struct | 36 bytes
uint32 - Spell Cost (if auto-calc, game bases cost on the sum of the effect costs)
uint32 - Flags
0x00000001 - not Auto-Calculate
0x00010000 - Unknown1 (always set if Unknown2 is set)
0x00020000 - PC Start Spell
0x00040000 - Unknown2 (always set if Unknown1 is set)
0x00080000 - Area Effect Ignores Line of Sight
0x00100000 - Ignore Resistance
0x00200000 - Disallow Spell Absorb/Reflect
0x00400000 - Unknown3
0x00800000 - No Dual Cast Modifications
uint32 - Type
0x00 - Spell
0x01 - Disease
0x02 - Power
0x03 - Lesser Power
0x04 - Ability
0x05 - Poison
0x0A - Addiction
0x0B - Voice
float - ChargeTime (if auto-calc, game uses the maximum of the casting times of the effects instead)
uint32 - CastType
0x00 - Constant Effect
0x01 - Fire and Forget
0x02 - Concentration
uint32 - Delivery
0x00 - Self
0x01 - Contact
0x02 - Aimed
0x03 - Target Actor
0x04 - Target Location
float - Cast Duration - determines minimum duration of a Concentrated spell.
float - Range (valid for Delivery Target Actor or Target Location)
formid - PERK of half-cost perk |
| * |  | Effects | Effect[] | One entry per effect. |
|  |  |  |  |  |
| + | EFID | EffectID | formid | Magic Effect MGEF |
| + | EFIT | EffectItem | struct | 12 bytes
float Magnitude
uint32 Area of Effect
uint32 Duration (0 = instant)
For auto-calc purposes, the game calculates the cost of an effect as:

effect_base_cost * (Magnitude * Duration / 10) ^ 1.1
A Magnitude < 1 is treated as 1, and a Duration of 0 as 10. For concentration spells, the Duration is also treated as 10. |
| * | CTDA | Conditions | CTDA | Conditions on the effect. |

## Navigation menu

## Views

## Personal tools

## Search

## general

## Content

## Community

## Tools

