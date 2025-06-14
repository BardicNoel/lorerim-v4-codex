# SOPM Record Structure (UESP)

*Source: [UESP - SOPM](https://en.uesp.net/wiki/Skyrim_Mod:Mod_File_Format/SOPM)*

| C | SubRecord | Name | Type/Size | Info |
| --- | --- | --- | --- | --- |
| + | EDID | editorId | zstring | Editor id |
| - | NAM1 | data | struct(4 bytes) | uint8 - Flags
0x1 = Attenuates With Distance
0x2 = Allows Rumble
uint8[2] - Unknown
uint8 - Reverb Send Percentage |
| - | FNAM | unused | uint32 | Left over from earlier version |
| + | MNAM | type | uint32 | 0 - Uses HRTF
1 - Defined Speaker Output |
| - | CNAM | unused | uint32 | Left over from earlier version |
| - | SNAM | unused | struct(16 bytes) | Left over from earlier version |
| - | ONAM | output values | uint8[8][3] | Three channels of output values, each channel has eight outputs (L, R, C, LFE, RL, RR, BL, BR) |
| - | ANAM | attenuation values | struct(20 bytes) | uint8[4] - Unknown
float32 - Min Distance
float32 - Max Distance
uint8[5] - Curve
uint8[3] - Unknown, probably padding |

## Navigation menu

## Views

## Personal tools

## Search

## general

## Content

## Community

## Tools

