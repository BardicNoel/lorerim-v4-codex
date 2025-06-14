# IMGS Record Structure (UESP)

*Source: [UESP - IMGS](https://en.uesp.net/wiki/Skyrim_Mod:Mod_File_Format/IMGS)*

| C | SubRecord | Name | Type/Size | Info |
| --- | --- | --- | --- | --- |
| + | EDID | editorId | zstring | Editor id |
| - | ENAM | unknown | float[14] | Alternative to HNAM/CNAM/TNAM fields only 2 occurrences
float Eye Adapt Speed
float Bloom Blur Radius
float Bloom Threshold
float Bloom Scale
float Receive Bloom Treshold
float Sunlight Scale
float Sky Scale
float Saturation
float Brightness
float Contrast
float[4] unknown 0 |
| - | HNAM | HDR Parameters | float[9] | float Eye Adapt Speed
float Bloom Blur Radius
float Bloom Threshold
float Bloom Scale
float Receive Bloom Treshold
float White
float Sunlight Scale
float Sky Scale
float Eye Adapt Strength
Format is a list of floating points - in the order of: Eye Adapt Speed, Bloom Radius, Bloom Threshold, Bloom Scale, Target Luminance #1, Target Luminance #2 (unsure of what these two do - I believe the first is target LUM, what's considered bright, and the second is the upper lum clamp; how many lums the eye will adapt to at a max, but I'm not positive), Sunlight Scale, Sky scale, Eye Adapt Strength. |
| - | CNAM | Cinematic Parameters | float[3] | float Saturation
float Brightness
float Contrast |
| - | TNAM | Tint Parameters | float[4] | float Tint Amount
float Red
float Green
float Blue |
| - | DNAM | Depth of Field | float[3] or float[4] | float Strength
float Distance
float Range
float? unknown, may be missing, seems to influence Blur Radius and the No Sky flag |

## Navigation menu

## Views

## Personal tools

## Search

## general

## Content

## Community

## Tools

