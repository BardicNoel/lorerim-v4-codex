# WTHR Record Structure (UESP)

*Source: [UESP - WTHR](https://en.uesp.net/wiki/Skyrim_Mod:Mod_File_Format/WTHR)*

| C | SubRecord | Name | Type/Size | Info |
| --- | --- | --- | --- | --- |
| + | EDID | editorId | zstring | Editor id |
| - | *0TX | cloud textures | zstring | Path to .dds - 00TX maps to layer 0, layer n will use a texture, if there's a field ascii(ord('0')+n)0TX |
| - | LNAM | unknown | uint32 | Number of Texture Layers always 0x04 or 0x1d |
| - | MNAM | precipitation | formID | Precipitation - SPGD formID |
| - | NNAM | visual effect | formID | Visual Effect |
| - | RNAM | unknown | struct | 32 bytes, Cloud Speed Y (-0.1 - 0.1), byte n corresponds to layer n, float encoded as uint8: 0x00->-0.1, 0x7f->0, 0xfe->0.1 |
| - | QNAM | unknown | struct | 32 bytes, Cloud Speed X (-0.1 - 0.1), byte n corresponds to layer n, encoding as above |
| + | PNAM | cloud texture color | struct[32] | 512 bytes, 32 structs of 16 bytes, one for each layer
rgb Sunrise
rgb Day
rgb Sunset
rgb Night |
| - | JNAM | cloud texture alpha | struct[32] | 512 bytes, 32 structs of 16 bytes, one for each layer
float Sunrise alpha
float Day alpha
float Sunset alpha
float Night alpha |
| + | NAM0 | unknown | struct[] | 208/224/272 bytes, structs of 16 bytes, color definitions
rgb Sunrise
rgb Day
rgb Sunset
rgb Night
The n-th struct corresponds to the following type

0 - Sky-Upper
1 - Fog Near
2 - seems to be ignored, might correspond to "Cloud Layer" which is overwritten by more detailed PNAM field
3 - Ambient
4 - Sunlight
5 - Sun
6 - Stars
7 - Sky-Lower
8 - Horizon
9 - Effect Lightning
10 - Cloud LOD Diffuse
11 - Cloud LOD Ambient
12 - Fog Far defaults to black
13 - Sky Statics defaults to black
14 - Water Multiplier defaults to white (? see NAM2/3)
15 - Sun Glare defaults to white
16 - Moon Glare defaults to white |
| - | FNAM | unknown | struct | 32 byte structure - Fog Distance
float Day Near
float Day Far
float Night Near
float Night Far
float Day Pow
float Night Pow
float Day Max
float Night Max |
| + | DATA | unknown | struct | 19 byte structure - several uint8 are displayed as float by the CK, see the ranges given
uint8 Wind Speed (0-1)
uint8 unknown - always 0
uint8 unknown - always 0
uint8 Trans Delta (0-.25)
uint8 Sun Glare (0-1)
uint8 Sun Damage (0-1)
uint8 Precipitation - Begin Fade In (0-1)
uint8 Precipitation - End Fade Out (0-1)
uint8 Thunder / Lightning - Begin Fade In (0-1)
uint8 Thunder / Lightning - End Fade Out (0-1)
uint8 Thunder / Lightning - Frequency 255 low to 15 high DefaultWeather has 0 here, displayed as low by the CK too
uint8 flags - first four are Precipitation/Weather Classification (at most one set, defaults to None), following two are Effects/Aurora
0x01 - Pleasant
0x02 - Cloudy
0x04 - Rainy
0x08 - Snow
0x10 - Always Visible
0x20 - Follows Sun Position
rbg Precipitation/Lightning Color
uint8 unknown - always 0
uint8 Wind Direction (0-360)
uint8 Wind Dir Range (0-180) |
| - | NAM1 | unknown | uint32 | Disabled flags - bit n corresponds to layer n, set if disabled |
| * | SNAM | ambient sounds | struct | 8-byte struct
formID - Sound Reference (SNDR)
uint32 - Type
0 - Default
1 - Precip
2 - Wind
3 - Thunder |
| * | TNAM | sky statics | formID | Static (STAT) formID |
| - | IMSP | image spaces | formID[4] | Array of 4 (IMGS) formIDs (Sunrise/Day/Sunset/Night) |
| * | DALC | lighting data | struct | Directional Ambient, 4 fields for Sunrise, Day, Sunset, Night, usually 32 bytes, but just 24 in one case (TESTCloudyRain)
rgb - Directional Ambient X+
rgb - Directional Ambient X-
rgb - Directional Ambient Y+
rgb - Directional Ambient Y-
rgb - Directional Ambient Z+
rgb - Directional Ambient Z-
rgb - Specular Color defaults to 0/0/0 if absent
float - Fresnel Power (0-1) defaults to 1 if absent |
| - | MODL | aurora model | MODL | Aurora - Includes optional field MODT |
| - | NAM2 |  | uint32[4]? | unknown - appears together with NAM3, either four times 0x00ffffff or 0xffffffff, probably responsible for some of the default whites in NAM0. Only found in a couple of older forms, goes away when saving in CK. |
| - | NAM3 |  | uint32[4]? | unknown - same as NAM2 |

| SubRecord | Type/Size | Info |
| --- | --- | --- |
| DNAM | zstring | Cloud Texture Layer 0 - Alternative to 00TX |
| CNAM | zstring | Cloud Texture Layer 1 - Alternative to 10TX |
| ANAM | zstring | Cloud Texture Layer 2 - Alternative to 20TX |
| BNAM | zstring | Cloud Texture Layer 3 - Alternative to 30TX |
| ONAM | uint8[4] | Alternative to QNAM
uint8 cloud speed layer 0
uint8 cloud speed layer 1
uint8 cloud speed layer 2
uint8 cloud speed layer 3
0x00 to 0x7f corresponds to CK displayed values of 0 to 0.1, unclear how values 0x80 to 0xff would be interpreted |

## Navigation menu

## Views

## Personal tools

## Search

## general

## Content

## Community

## Tools

