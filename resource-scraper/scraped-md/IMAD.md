# IMAD Record Structure (UESP)

*Source: [UESP - IMAD](https://en.uesp.net/wiki/Skyrim_Mod:Mod_File_Format/IMAD)*

| C | SubRecord | Name | Type/Size | Info |
| --- | --- | --- | --- | --- |
| + | EDID | editorId | zstring | Editor id |
| + | DNAM |  | struct | unit32 - flag
0x1 - Animatable
float - Duration
uint32[] - the number of different time entries for each field (?) |
| + | BNAM | blur | imad | Blur Radius |
| + | VNAM | double vision | imad | Double Vision Strength |
| + | TNAM | tint | float[] | Series of float 5-tuples specifying tint colors
float - timestamp
float - red
float - green
float - blue
float - alpha |
| + | NAM3 | fade | float[] | Series of float 5-tuples specifying fade colors
float - timestamp
float - red
float - green
float - blue
float - alpha |
| + | RNAM |  | imad | Radial Blur Str |
| + | SNAM |  | imad | Radial Blur Rampup |
| + | UNAM |  | imad | Radial Blur Start |
| + | NAM1 |  | imad | Radial Blur Rampdown |
| + | NAM2 |  | imad | Radial Blur DownStart |
| + | WNAM |  | imad | Depth Of Field Strength |
| + | XNAM |  | imad | Depth Of Field Distance |
| + | YNAM |  | imad | Depth Of Field Range |
| + | NAM4 |  | imad | FullScreen Motion Blur |
| + | ^@IAD |  | imad | Eye Adapt Speed Multiply |
| + | @IAD |  | imad | Eye Adapt Speed Add |
| + | ^AIAD |  | imad | Bloom Blur Radius Multiply |
| + | AIAD |  | imad | Bloom Blur Radius Add |
| + | ^BIAD |  | imad | Bloom Treshold Multiply |
| + | BIAD |  | imad | Bloom Treshold Add |
| + | ^CIAD |  | imad | Bloom Scale Multiply |
| + | CIAD |  | imad | Bloom Scale Add |
| + | ^DIAD |  | imad | Target Lum Min Multiply |
| + | DIAD |  | imad | Target Lum Min Add |
| + | ^EIAD |  | imad | Target Lum Max Multiply |
| + | EIAD |  | imad | Target Lum Max Add |
| + | ^FIAD |  | imad | Sunlight Scale Multiply |
| + | FIAD |  | imad | Sunlight Scale Add |
| + | ^GIAD |  | imad | Sky Scale Multiply |
| + | GIAD |  | imad | Sky Scale Add |
| + | ^HIAD |  | imad | unknown |
| + | HIAD |  | imad | unknown |
| + | ^IIAD |  | imad | unknown |
| + | IIAD |  | imad | unknown |
| + | ^JIAD |  | imad | unknown |
| + | JIAD |  | imad | unknown |
| + | ^KIAD |  | imad | unknown |
| + | KIAD |  | imad | unknown |
| + | ^LIAD |  | imad | unknown |
| + | LIAD |  | imad | unknown |
| + | ^MIAD |  | imad | unknown |
| + | MIAD |  | imad | unknown |
| + | ^NIAD |  | imad | unknown |
| + | NIAD |  | imad | unknown |
| + | ^OIAD |  | imad | unknown |
| + | OIAD |  | imad | unknown |
| + | ^PIAD |  | imad | unknown |
| + | PIAD |  | imad | unknown |
| + | ^QIAD |  | imad | Saturation Multiply |
| + | QIAD |  | imad | Saturation Add |
| + | ^RIAD |  | imad | Brightness Multiply |
| + | RIAD |  | imad | Brightness Add |
| + | ^SIAD |  | imad | Contrast Multiply |
| + | SIAD |  | imad | Contrast Add |
| + | ^TIAD |  | imad | unknown |
| + | TIAD |  | imad | unknown |

## Navigation menu

## Views

## Personal tools

## Search

## general

## Content

## Community

## Tools

