# SNDR Record Structure (UESP)

*Source: [UESP - SNDR](https://en.uesp.net/wiki/Skyrim_Mod:Mod_File_Format/SNDR)*

| C | SubRecord | Name | Type/Size | Info |
| --- | --- | --- | --- | --- |
| + | EDID | editorId | zstring | Editor id |
| + | CNAM | sound descriptor type | uint32 | CRC32 hash of the class name (i.e. "BGSStandardSoundDef") Note that Bethesda uses a non standard CRC. |
| + | GNAM | category | formID | Sound Category (SNCT) formid |
| - | SNAM | sound | formID | reference to another (SNDR) formid |
| - | FNAM | unknown | dword |  |
| * | ANAM | a track | zstring | path to .wav |
| + | ONAM | output model | formID | Output Model (SOPM) formid |
| * | CTDA | condition data | CTDA | condition data |
| - | LNAM |  | struct | uint16 flags
0x0001 ?
0x0002 ? mostly seen with 0x0800
0x0800 Looping: Loop
0x1000 Looping: Envelope Fast
0x2000 Looping: Envelope Slow
At most one of the looping flags can be set
uint8 - unused
uint8 - Rumble Send
Small - 7 * Lower 4 bits
Big - 7 * Upper 4 bits |
| + | BNAM |  | struct | int8 - % Frequency Shift
uint8 - % Frequency Variance
uint8 - Priority (default 128)
uint8 - dB Variance
uint16 - Static Attenuation (dB) Stored value is 100 times actual value |

## Navigation menu

## Views

## Personal tools

## Search

## general

## Content

## Community

## Tools

