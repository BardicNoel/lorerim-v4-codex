# CLMT Record Structure (UESP)

*Source: [UESP - CLMT](https://en.uesp.net/wiki/Skyrim_Mod:Mod_File_Format/CLMT)*

| C | SubRecord | Name | Type/Size | Info |
| --- | --- | --- | --- | --- |
| + | EDID | editorId | zstring | Editor id |
| + | WLST | weather list | struct[] | array of 12-byte structs
formid - WTHR
uint32 - Chance in percent
formid - Global |
| - | FNAM | sun texture | zstring | path to sun .dds |
| - | GNAM | glare texture | zstring | path to glare .dds |
| + | MODL | night sky model | MODL | Night Sky - Includes optional field MODT always Sky\Stars.nif |
| + | TNAM | sun and moon | struct | 6-byte struct - Sun and Moon
uint8 - Sunrise Begin - times 10 minutes
uint8 - Sunrise End - times 10 minutes
uint8 - Sunset Begin - times 10 minutes
uint8 - Sunset End - times 10 minutes
uint8 - Volatility - 0-100
uint8 - Moons
mask 0x3F - Moon Phase Length in days
0x40 - Masser
0x80 - Secunda |

## Navigation menu

## Views

## Personal tools

## Search

## general

## Content

## Community

## Tools

