# CSTY Record Structure (UESP)

*Source: [UESP - CSTY](https://en.uesp.net/wiki/Skyrim_Mod:Mod_File_Format/CSTY)*

| C | SubRecord | Name | Type/Size | Info |
| --- | --- | --- | --- | --- |
| + | EDID | editorId | zstring | Editor id |
| + | CSGD | general | float[] | 2, 8 or 10 floats †
Offensive Mult
Defensive Mult
Group Offensive Mult (default 1.0)
Melee Equipment Mult (default 1.0)
Magic Equipment Mult (default 1.0)
Ranged Equipment Mult (default 1.0)
Shout Equipment Mult (default 1.0)
Unarmed Mult (default 1.0)
Staff Equipment Mult (default 1.0)
Avoid Threat Chance (default 0.2) |
| - | CSME | melee | float[] | 7 or 8 floats †
Attack Staggered Mult (default 1.0)
Power Attack Staggered Mult (default 1.0)
Power Attack Blocking Mult (default 1.0)
Bash Mult (default 1.0)
Bash Recoiled Mult (default 1.0)
Bash Attack Mult (default 1.0)
Bash Power Attack Mult (default 1.0)
Special Attack Mult (default 0.1) |
| - | CSCR | close range | float[] | 2 or 4 floats †
Dueling Circle Mult (default 0.2)
Dueling Fallback Mult (default 0.2)
Flank Distance (default 0.2)
Flanking Stalk Time (default 0.2) |
| - | CSLR | long range | float | Strafe Mult (default 0.2) |
| - | CSFL | flight | float[] | 1 to 8 floats †
Hover Chance (default 0.5)
Dive Bomb Chance (default 1.0)
Ground Attack Chance (default 0.5)
Hover Time (default 0.5)
Ground Attack Time (default 0.5)
Perch Attack Chance (default 0.5)
Perch Attack Time (default 0.5)
Flying Attack Chance (default 0.75) |
| - | DATA | flags | uint32 | Flags, exactly one of either Dueling or Flanking is always set
0x1 Dueling
0x2 Flanking
0x4 Allow Dual Wielding |

## Navigation menu

## Views

## Personal tools

## Search

## general

## Content

## Community

## Tools

