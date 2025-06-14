# REVB Record Structure (UESP)

*Source: [UESP - REVB](https://en.uesp.net/wiki/Skyrim_Mod:Mod_File_Format/REVB)*

| C | V | Field | Name | Type/Size | Info |
| --- | --- | --- | --- | --- | --- |
| + |  | EDID | editorID | zstring | editor ID |
| + |  | DATA | data | struct | 14 bytes
uint16  decay time (milliseconds)
uint16  HF reference (Hertz)
int8    room filter
int8    room HF filter
int8    reflections
int8    reverb amp
uint8   decay HF ratio (x100, real value is actually one hundreth of that, e.g. a value of 123 means 1.23)
uint8   scaled reflect delay (scaled by approx. 0.83 - value 0x00 maps to 0, 0xF9 maps to 300)
uint8   reverb delay (milliseconds)
uint8   diffusion %
uint8   densitiy %
uint8   unknown (seems to be zero in most cases, probably unused?) |

## Navigation menu

## Views

## Personal tools

## Search

## general

## Content

## Community

## Tools

