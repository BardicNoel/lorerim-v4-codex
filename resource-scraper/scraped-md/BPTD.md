# BPTD Record Structure (UESP)

*Source: [UESP - BPTD](https://en.uesp.net/wiki/Skyrim_Mod:Mod_File_Format/BPTD)*

| C | SubRecord | Name | Type/Size | Info |
| --- | --- | --- | --- | --- |
| + | EDID | editorId | zstring | Editor id |
| - | MODL | model | MODL | Includes Fields MODB, MODT, MODS, MODD |
| + | BPTN | body part name | lstring | Body part name (eg 'head'). |
| + | BPNN | body part node name | zstring | Body part node name it attaches to |
| + | BPNT | body part node title | zstring | Body part node title (usually same as BPNN but not always) |
| + | BPNI | body part node info | zstring | Usually a path to a .nif but can be blank or a value like '[body]' |
| + | BPND | body part node data | struct | 84 Byte Struct
Float - Damage Mult
uint8 - Flags
Severable
IK Data
IK Data - Biped Data
Explodable
IK Data - Is Head
IK Data - Headtracking
To Hit Chance - Absolute
uint8 - Part Type (Lookup)
Torso
Head
Eye
LookAt
Fly Grab
Saddle
uint8 - Health Percent
sint8 - Actor Value (Actor Values)
uint8 - To Hit Chance
uint8 - Explodable - Explosion Chance %
uint16 - Explodable - Debris Count
FormID - Explodable - Debris DEBR
FormID - Explodable - Explosion EXPL
Float - Tracking Max Angle
Float - Explodable - Debris Scale
sint32 - Severable - Debris Count
FormID - Severable - Debris DEBR
FormID - Severable - Explosion EXPL
Float - Severable - Debris Scale
Struct - Gore Effects Positioning
Translate
Float - X
Float - Y
Float - Z
Rotation
Float - X
Float - Y
Float - Z
FormIDCk - Severable - Impact DataSet IPDS
FormIDCk - Explodable - Impact DataSet IPDS
uint8 - Severable - Decal Count
uint8 Explodable - Decal Count
uint16 - 'Unknown'
Float - Limb Replacement Scale |
| + | NAM1 | Limb Replacement Model | zstring | Limb Replacement Model |
| + | NAM4 | Gore Effects | zstring | Gore Effects - Target Bone |
| + | NAM5 | Hashes | Array | Texture Files Hashes |
| - | RAGA | Ragdoll | FormID | RGDL |

## Navigation menu

## Views

## Personal tools

## Search

## general

## Content

## Community

## Tools

