# FURN Record Structure (UESP)

*Source: [UESP - FURN](https://en.uesp.net/wiki/Skyrim_Mod:Mod_File_Format/FURN)*

| C | SubRecord | Name | Type/Size | Info |
| --- | --- | --- | --- | --- |
| + | EDID | editorId | zstring | Editor id |
| - | VMAD | script info | VMAD | Script info |
| + | OBND | object bounds | OBND | Object Bounds |
| - | FULL | full | lstring | Full (in-game) id |
| - | MODL | model | MODL | Includes Fields MODT, MODS |
| - | DEST | destruction data | DEST | Includes Fields DSTD, DSTF |
| - | KSIZ | keyword count | KSIZ | Keyword count |
| - | KWDA | keywords | KWDA | KYWD[] |
| + | PNAM | unknown | uint32 | 4 bytes, 0 or 00334ccc seen |
| + | FNAM | flags | uint16 | Flags
0x02 : Ignored by Sandbox |
| - | KNAM | interaction keyword | formID | KYWD formid |
| + | MNAM | flags | uint32 | 0x00ffffff : Flags that indicate which of the model markers are active (i.e., 0x01 = first marker is active)
0x02000000 : Disables Activation
0x04000000 : Is Perch
0x08000000 : Must Exit to Talk
0x40000000 : ?
0x80000000 : ? |
| + | WBDT | workbench data | struct | 2 bytes
uint8 Workbench     One of 8 hardcoded types
0 : None
1 : Create Object
2 : Smithing Weapon
3 : Enchanting
4 : Enchanting Experiment
5 : Alchemy
6 : Alchemy Experiment
7 : Smithing Armor
uint8 ActorValue    Skill for using the workbench (one of 18 AV or 0xFF for none) |
| - | XMRK | marker model | MODL | Model filename |
| - | NAM1 | unknown | formID | Spell associated with item? |
| * | ENAM | unknown | uint32 | marker index, optionally for each marker, followed by optional fields NAM0, FNMK |
| * | NAM0 | unknown | struct | uint16 unknown - usually 0x0000, but 0x0002 seen too
uint16 flags - inactive marker entry points those show no checkmark
0x01 Front
0x02 Behind
0x04 Right
0x08 Left
0x10 Up |
| * | FNMK | marker keyword | formID | KYWD formID |
| * | FNPR | marker | struct | one for each marker
uint16 flags marker type, exactly one is set
0x01 Sit
0x02 Sleep
0x04 UNKNOWN displayed thus in CK, seems to be "leaning"
uint16 flags marker entry point
0x01 Front
0x02 Behind
0x04 Right
0x08 Left
0x10 Up |

## Navigation menu

## Views

## Personal tools

## Search

## general

## Content

## Community

## Tools

