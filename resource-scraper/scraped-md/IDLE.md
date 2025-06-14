# IDLE Record Structure (UESP)

*Source: [UESP - IDLE](https://en.uesp.net/wiki/Skyrim_Mod:Mod_File_Format/IDLE)*

| C | SubRecord | Name | Type/Size | Info |
| --- | --- | --- | --- | --- |
| - | EDID | editorId | zstring | Editor id |
| * | CTDA | script | CTDA | script info |
| - | DNAM | havok file | zstring | Path to .hkx |
| - | ENAM | Anim Event | zstring | eg 'HorseExitSwim', 'NPCshoutStart' |
| + | ANAM | animations | formid[2] | 2 formids
parent, IDLE  formid OR Action(AACT) for true root
previous IDLE |
| + | DATA | unknown | struct | 6 bytes, usually 00-00-00/01, 4th byte almost never empty, 00-00
uint8 Min Looping Seconds
uint8 Max Looping Seconds
If both min and max looping seconds are set to 255 (i.e. maximum value), that means 'loop forever'.
uint8 flags
0x02 - Sequence
0x04 - Not attacking
0x08 - Blocking
uint8 unknown
uint16 Replay Delay |

## Navigation menu

## Views

## Personal tools

## Search

## general

## Content

## Community

## Tools

