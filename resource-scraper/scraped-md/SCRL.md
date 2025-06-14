# SCRL Record Structure (UESP)

*Source: [UESP - SCRL](https://en.uesp.net/wiki/Skyrim_Mod:Mod_File_Format/SCRL)*

| C | Field | Name | Type/Size | Info |
| --- | --- | --- | --- | --- |
| + | EDID | EditorID | zstring | Max 0x200 bytes, including null terminator. |
| + | OBND | ObjectBounds | OBND | Always 12 bytes even if all 0s |
| - | FULL | FullName | lstring | Full (in-game) name |
| - | KSIZ | KSIZ | uint32 | KYWD count |
| * | KWDA | KWDA | formid[KSIZ] | Array of KYWD formids |
| + | MDOB | MenuIcon | formid | Menu display object STAT |
| + | ETYP | EquipType | formid | Equip slot EQUP |
| + | DESC | Description | lstring | In-game description - if 0 concatenated descriptions of effects is shown ingame. |
| - | MODL | Model | MODL | Ground Model |
| - | YNAM | PickupSound | formid | Pickup SNDR |
| - | ZNAM | DropSound | formid | Drop SNDR |
| + | DATA | ItemData | struct | 8 bytes
uint32 - Value
float - Weight |
| + | SPIT | ScrollData | struct | 36 bytes
uint32 - Spell Cost - but all scrolls in the game data use autocalcc
uint32 - Flags
0x000001 - ManualCalc
0x080000 - Area Effect Ignores Line of Sight
0x100000 - Script Effect Always Applies
0x200000 - No Absorb/Reflect
 ? - Force Touch Explode
uint32 - Unknown - Always 0? This seems to match spell type for SPEL but is always a Spell (0)
float - ChargeTime
uint32 - Unknown - Always 0x03 or 0x02 This seems to match cast type Value is usually Scroll (3)
uint32 - TargetType
0x00 - Self
0x01 - Touch
0x02 - Aimed
0x03 - Target Actor
0x04 - Target Location
uint32 - CastDuration- Always 0? Doesn't seem applicable to scrolls
uint32 - Range - Always 0? Doesn't seem applicable to scrolls
uint32 - HalfCostPerk - Always 0? Doesn't seem applicable to scrolls |
| - | DEST | destruction data | DEST | See DEST page. |
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

