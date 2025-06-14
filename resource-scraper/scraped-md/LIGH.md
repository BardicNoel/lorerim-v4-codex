# LIGH Record Structure (UESP)

*Source: [UESP - LIGH](https://en.uesp.net/wiki/Skyrim_Mod:Mod_File_Format/LIGH)*

| C | SubRecord | Name | Type/Size | Info |
| --- | --- | --- | --- | --- |
| + | EDID | EditorID | zstring |  |
| - | VMAD | Scripting | VMAD | Scripting Info |
| + | OBND | Bounds | OBND | Object Bounds |
| - | MODL | model | MODL | Includes Field MODT |
| - | DEST | destruction data | DEST | Includes Fields DSTD, DMDL, DMDT, DMDS |
| - | FULL | Item name | lstring |  |
| + | ICON | icon | zstring | Inventory icon filename |
| + | MICO | icon | zstring | Message icon filename |
| + | DATA | Light Data | 48 byte struct | int32 Time (-1 = Infinite)
uint32 Radius
rgb Color (0x00BBGGRR)
uint32 Flags
0x0001 Dynamic?
0x0002 Can be carried
0x0008 Effect: Flicker
0x0020 Off by default
0x0040 Effect: FlickerSlow?
0x0080 Effect: Pulse
0x0400 Type: Shadow Spotlight
0x0800 Type: Shadow Hemisphere
0x1000 Type: Shadow Omnidirectional
0x2000 Portal-Strict Flag 0x20000 is also set in the record's Header flags
At most on Effect flag can be set, defaults to "None" if none is set. FlickerSlow can't be specified in the CK, but several records have it set
At most one Type flag can be set, if none is set type defaults to "Omnidirectional"
float Falloff Exponent
float FOV (default of 90 deg)?
float Near Clip (some strange values from 9e-13 to 1.67e+8)
float 1/Period
float Intensity Amplitude
float Movement Amplitude
uint32 Value
float Weight |
| + | FNAM | Fade | float | Ranges from 0.1 to 10 |
| + | SNAM | Holding Sound | formID | SNDR |

## Navigation menu

## Views

## Personal tools

## Search

## general

## Content

## Community

## Tools

