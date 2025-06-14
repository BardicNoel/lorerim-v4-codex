# CAMS Record Structure (UESP)

*Source: [UESP - CAMS](https://en.uesp.net/wiki/Skyrim_Mod:Mod_File_Format/CAMS)*

| C | SubRecord | Name | Type/Size | Info |
| --- | --- | --- | --- | --- |
| + | EDID | editorId | zstring | Editor id |
| - | MODL | model | zstring | Models\ relative .nif player cam only one without |
| - | MODT | model data | ubyte[12] | When present always 12 bytes, (02-00-00-00-00-00-00-00-00-00-00-00) |
| + | DATA | cam data | struct | 40-byte/44-byte struct, probably positional though they appear to also be able to control time flow (RSideCam01/Fast/Slow)
uint32 Camera Action  0-2
0x00 - Shoot
0x01 - Fly
0x02 - Hit
0x03 - Zoom
uint32 Camera Location  0-3
0x00 - Attacker
0x01 - Projectile
0x02 - Target
0x03 - Lead Actor
uint32 Camera Target  0-2
0x00 - Attacker
0x01 - Projectile
0x02 - Target
0x03 - Lead Actor
uint32 Flags (bitfield)  6-39
0x01 - Position Follows Location
0x02 - Rotation Follows Target
0x04 - Don't Follow Bone
0x08 - First Person Camera
0x10 - No Tracer
0x20 - Start At Time Zero
float player time multiplier  0.4-1 (allowed range: [0.0;20.0])
float target time multipliier  0.4-1 (allowed range: [0.0;20.0])
float global time multiplier  0.025-1 (allowed range: [0.0;1.0])
float Max Time  0.2-17 (allowed range: [0.0;120.0])
float Min Time  0.05-5 (allowed range: [0.0;120.0])
float Target % Between Actors  0-50 (allowed range: [0.0;100.0])
float Near Target Distance (allowed range: [0.0;2000.0])
This last float value is only present in the 44 byte variant of this struct. It presumably defaults to zero for the shorter 40 byte variant. (The 44 byte variant was introduced in the Creation Kit update after patch 1.5 and mods created with that Creation Kit version might be incompatible with older, unpatched versions of Skyrim, if they use CAMS records.) |
| - | MNAM | effect | formid | IMAD formid, usually [IMAD 0x00035301] VATSImodDOF or [IMAD 0x0001BDAD] VATSImod |

## Navigation menu

## Views

## Personal tools

## Search

## general

## Content

## Community

## Tools

