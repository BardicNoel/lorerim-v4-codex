# SCEN Record Structure (UESP)

*Source: [UESP - SCEN](https://en.uesp.net/wiki/Skyrim_Mod:Mod_File_Format/SCEN)*

## Contents

## Main Record

| C | V | Field | Name | Type/Size | Info |
| --- | --- | --- | --- | --- | --- |
| + |  | EDID | Editor ID | zstring | Editor ID. |
| - |  | VMAD | script info | byte[] | scripting info |
| + |  | FNAM | Flags | uint32 | Bit 0 - Begin on quest start.
Bit 1 - Stop quest on end.
Bit 2 - Show all text.
Bit 3 - Repeat while condition block is true.
Bit 4 - Interruptible. |
| + |  |  | Phases | Phases[] | List of phases. |
| + |  |  | Actors | Actors[] | List of actors. |
| + |  |  | Actions | Actions[] | List of actions. |
| - |  | SCHR | Old Script | SCHR | Old scripting field. |
| + |  | PNAM | Parent Quest | formid | Parent quest. |
| + |  | INAM | Max Action | uint32 | Highest action number. Note: in rare cases, this may be higher than the highest action number, possibly indicating deleted actions. |
| + |  | VNAM | Behavior Settings | uint32[4] | Each uint32 corresponds to the "Set all" check boxes at the top of the Actor Behavior dialogue.
0 - Set all Normal.
1 - Set all Pause.
2 - Set all End.
3 - Don't set all. |
| - |  | CTDA | Conditions | struct | Scene Data conditions. |

## Phases

| C | V | Field | Name | Type/Size | Info |
| --- | --- | --- | --- | --- | --- |
| + |  | HNAM | Start Marker | 0-length |  |
| + |  | NAM0 | Description | zstring | Phase description. Always present, even if just a null-terminator. |
| * |  | CTDA | Start Conditions | struct |  |
| + |  | NEXT | Marker | 0-length | Delineates start conditions from completion conditions. |
| * |  | CTDA | Completion Conditions | struct |  |
| - |  | SCHR | Old Script | SCHR | Old scripting field. |
| + |  | NEXT | Marker | 0-length |  |
| - |  | SCHR | Old Script | SCHR | Old scripting field. |
| + |  | WNAM | Width | uint32 | Display width. |
| + |  | HNAM | End Marker | 0-length |  |

## Actors

| C | V | Field | Name | Type/Size | Info |
| --- | --- | --- | --- | --- | --- |
| + |  | ALID | Alias ID | uint32 | Alias ID of actor. |
| - |  | LNAM | Flags | uint32 | Actor flags. |
| - |  | DNAM | Behaviors | uint32 | Actor behaviors. |

## Actions

| C | Field | Name | Type/Size | Info |
| --- | --- | --- | --- | --- |
| + | ANAM | Type | uint16 | Start of Action block. Type of action.
0 - Dialogue.
1 - Package.
2 - Timer. |
| + | NAM0 | Description | zstring | Action description. |
| + | ALID | Alias ID | uint32 | Alias ID of actor performing action. |
| + | INAM | Action Num | uint32 | Action number.
Note: Two records in Skyrim.esm contain actions with overlapping numbers (T03WorshippersScene (0x0001C608) and DGScene04 (0x0001B113)). In all other cases, action numbers are unique within any given scene. |
| - | FNAM | Flags | uint32 | Flags.
Bit 15 - Face target.
Bit 16 - Looping.
Bit 17 - Head track player.
To date, all other flags are unused. |
| + | SNAM | Start Phase | uint32 | Phase action starts at. Zero-based, add one to value to match CK display values. |
| + | ENAM | End Phase | uint32 | Phase action ends at. Zero-based, add one to value to match CK display values. |
| Dialogue Actions Only |  |  |  |  |
| + | DATA | Topic | formid | Topic ID. |
| - | HTID | Head Tracking ID | int32 | Head-tracking alias ID. Values range from -1–225, 435 (0x1B3). High bit may be flag. |
| - | DMAX | Looping Max | float32 | Looping max. |
| - | DMIN | Looping Min | float32 | Looping min. |
| - | DEMO | Emotion Type | uint32 | Emotion type.
0 - Neutral.
1 - Anger.
2 - Disgust.
3 - Fear.
4 - Sad.
5 - Happy.
6 - Surprise.
7 - Puzzled. |
| - | DEVA | Emotion Value | uint32 | Emotion value. |
| Package Actions Only |  |  |  |  |
| * | PNAM | Package IDs | formid | Package IDs. |
| Timer Actions Only |  |  |  |  |
| + | SNAM | Duration | float32 | Duration of timer. Note: SNAM is repurposed within timer actions and appears in addition to the action start phase SNAM field. |
| - | SCHR | Old Script | SCHR | Old scripting field. |
| + | ANAM | End Marker | 0-sized | End of Action block. |

## Navigation menu

## Views

## Personal tools

## Search

## general

## Content

## Community

## Tools

