# CLAS Record Structure (UESP)

*Source: [UESP - CLAS](https://en.uesp.net/wiki/Skyrim_Mod:Mod_File_Format/CLAS)*

| C | Field | Name | Type/Size | Info |
| --- | --- | --- | --- | --- |
| + | EDID | editorID | zstring | Corresponds with Class EditorID |
| + | FULL | Name | lstring | Corresponds with Class Name (All resolved to ilstrings) |
| + | DESC | Description | lstring | Description (always 0 in base files but can be present in mods) |
| - | ICON | Description | zstring | Menu image |
| + | DATA | Data | struct[36] |  |
| 00:Unknown | uint32 | Possibly flags, but not displayed in CK |  |  |
| 04:Training Skill | uint8 | Trainer classes store a skill here.  Skill is provided using an actor value index - 6 |  |  |
| 05:Training Level | uint8 | The skill level to which the NPC will provide training.  0 if class is not used for trainers |  |  |
| 06-17:Skill Weights | uint8[18] | Each byte provides the weight assigned to one skill.  The skills are provided in actor value index order (skill at byte 06 is One-handed; at byte 17, Enchanting)
The weight is a value that normally ranges from 0 to 3, although values as high as 9 occur in some cases.  The weights are used to distribute the fixed 8 skill points per level among the various skills.  Skills with a weight of zero never increase.  See Skills for further information. |  |  |
| 18-1b:Bleedout Default | float |  |  |  |
| 1c-1f:Voice Points | uint32 |  |  |  |
| 20:Health Weight | uint8 | Each byte provides the weight assigned to that attribute.  The weights are used to distribute the fixed 10 attribute points per level among the three attributes.  Note that health always receives an additional 5 point/level increase, independent of its weight.  See Attributes for details. |  |  |
| 21:Magicka Weight | uint8 |  |  |  |
| 22:Stamina Weight | uint8 |  |  |  |
| 23:Flags? | uint8 | 0x1 seems to indicate guard |  |  |

## Weight Calculations

## Skills

| Skill | AVIF | Weight |  | Round 1 | Round 2 | Round 3 | Round 4 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Restoration | 22 | 4 |  | 1 | 1 | 1 | 1 |
| Speech | 17 | 3 |  | 1 | 1 | 1 |  |
| Enchanting | 23 | 2 |  | 1 | 1 |  |  |
| Illusion | 21 | 2 |  | 1 | 1 |  |  |
| Alchemy | 16 | 2 |  | 1 | 1 |  |  |
| Smithing | 10 | 2 |  | 1 | 1 |  |  |

## Attributes

## Navigation menu

## Views

## Personal tools

## Search

## general

## Content

## Community

## Tools

