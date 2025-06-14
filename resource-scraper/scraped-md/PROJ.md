# PROJ Record Structure (UESP)

*Source: [UESP - PROJ](https://en.uesp.net/wiki/Skyrim_Mod:Mod_File_Format/PROJ)*

| C | SubRecord | Name | Type/Size | Info |
| --- | --- | --- | --- | --- |
| + | EDID | editorID | zstring | Editor ID |
| + | OBND | object bounds | OBND | Object Bounds |
| - | FULL | full name | lstring | Full (in-game) name |
| - | MODL | model | MODL | Art File - Includes optional field MODT |
| - | DEST | destruction data | DEST | Includes Fields DSTD, DSTF |
| + | NAM1 | effect model | MODL | Muzzle Flash Model - Includes optional field NAM2 |
| + | DATA | unknown | struct | 92-byte struct
uint16 flags
0x0001 - Hitscan (Visible in VATS Only)
0x0002 - Explosion
0x0004 - Alt. Trigger
0x0008 - Muzzle Flash
0x0010
0x0020 - Can be Disabled
0x0040 - Can be Picked Up
0x0080 - Supersonic
0x0100 - Crit Effect: Pins Limbs
0x0200 - Pass Through Small Transparent
0x0400 -  Disable Combat Aim Correction
uint16 Projectile Type
0x01 - Missile
0x02 - Lobber
0x04 - Beam
0x08 - Flame
0x10 - Cone
0x20 - Barrier
0x40 - Arrow
float Gravity
float Speed
float Range
formID Light
formID Muzzle Flash Light
float Tracer Chance
float Explosion Proximity
float Explosion Timer
formID Explosion Type
formID Sound Record
float Muzzle Duration
float Fade Duration
float Impact Force
formID Countdown Sound
uint32 always 0
formID Default Weapon Source
float Cone Spread
float Collision Radius
float Lifetime
float Relaunch Interval
formID Decal Data
formID Collision Layer |
| - | VNAM | Sound Detection Level | uint32 | The amount of sound using the weapon generates, seems to be used in determining nearby NPCs detection of the actor using the weapon.
0x00 - Loud
0x01 - Normal
0x02 - Silent
0x03 - Very Loud |

## Navigation menu

## Views

## Personal tools

## Search

## general

## Content

## Community

## Tools

