# MUST Record Structure (UESP)

*Source: [UESP - MUST](https://en.uesp.net/wiki/Skyrim_Mod:Mod_File_Format/MUST)*

| C | SubRecord | Name | Type/Size | Info |
| --- | --- | --- | --- | --- |
| + | EDID | editorId | zstring | Editor id |
| + | CNAM | trackType | uint32 | 4 byte type identifier
0x6ED7E048 - single track
0xA1A9C4D5 - silent track
0x23F678C3 - palette |
| - | FLTV | duration | float | duration in seconds (only for silent tracks or palette tracks) |
| - | DNAM | fadeOut | float | fade-out in seconds (appears in palette tracks only) |
| - | ANAM | a track | zstring | path to .wav |
| - | BNAM | b track | zstring | path to .wav |
| - | FNAM | Cue Points | float[] | arbitrary number of floating point values giving the cue points (in seconds) |
| - | SNAM | tracks | formid[] | Array of MUST, total count arbitrary - probably pre-MUSC collections
Form IDs of value zero are used to separate layers. (0x00000000 is no valid form ID anyway.) |
| - | LNAM | loop data | struct | 12-byte struct
float Loop Begins (seconds)
float Loop Ends (seconds)
uint32 Loop Count |
| - | CITC | condition count | uint32 | condition count |
| * | CTDA | condition data | CTDA | conditions |

## Navigation menu

## Views

## Personal tools

## Search

## general

## Content

## Community

## Tools

