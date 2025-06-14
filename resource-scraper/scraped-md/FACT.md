# FACT Record Structure (UESP)

*Source: [UESP - FACT](https://en.uesp.net/wiki/Skyrim_Mod:Mod_File_Format/FACT)*

| C | V | Field | Name | Type/Size | Info |
| --- | --- | --- | --- | --- | --- |
| + |  | EDID | editorID | zstring | Faction name |
| - |  | FULL | name | lstring | Full name |
| * |  | XNAM | Interfaction Relations | struct | formid - Faction
int32 - Mod (appears to be unused - no longer editable in CK and only non-zero for CWDisaffectedSoldierFaction (0004BB3F))
int32 - Combat
0 - Neutral
1 - Enemy
2 - Ally
3 - Friend |
| + |  | DATA | flags | uint32 | Flags
0x1 - Hidden from PC
0x2 - Special Combat
0x40 - Track Crime
0x80 - Ignore Murder
0x100 - Ignore Assault
0x200 - Ignore Stealing
0x400 - Ignore Trespass
0x800 - Do not report crimes against members
0x1000 - Crime Gold, Use Defaults
0x2000 - Ignore Pickpocket
0x4000 - Vendor
0x8000 - Can Be Owner
0x10000 - Ignore Werewolf |
| - |  | JAIL | Prison Marker | formid | REFR formid - The exterior jail marker for the faction's prison. |
| - |  | WAIT | Follower Wait Marker | formid | REFR formid - Marker the player's followers are assigned to wait at. |
| - |  | STOL | Evidence Chest | formid | REFR formid - Stolen goods are stored in this chest. |
| - |  | PLCN | Player Belongings Chest | formid | REFR formid - Player's inventory is stored in this chest. |
| - |  | CRGR | Crime Group | formid | Crime Factions List (FLST) |
| - |  | JOUT | Jail Outfit | formid | OTFT formid - Jail outfit the player is given. |
| - |  | CRVA | Crime Gold | struct[12/16/20] | Size varies in record versions 30 and below, additional fields are those at the end of the structure. Seems to be required normally, but one record, MS08AlikrFaction (000215D3) in Skyrim.esm, doesn't have one.
uint8 - 1 = Arrest
uint8 - 1 = Attack on Sight
uint16 - Murder
uint16 - Assault
uint16 - Trespass
uint16 - Pickpocket
uint16 - Unused (usually 0, but not always, changing data has no effect in CK)
float - Steal Mult.
uint16 - Escape
uint16 - Werewolf |
| * |  |  | Ranks | Rank[] | Listing of ranks, if any, and their names. |
| * |  | RNAM | Rank ID | uint32 | Rank ID |
| - |  | MNAM | Male Rank Title | lstring | Male title |
| - |  | FNAM | Female Rank Title | lstring | Female title |
| - |  | VEND | Vendor List | formid | Merchandise list (FLST) |
| - |  | VENC | Vendor Chest | formid | Reference to vendor chest (REFR) |
| - | 29+ | VENV |  | struct[12] | All 0s unless vendor; always present in record versions 29 and above, never present in record versions 28 and below
uint16 - Start hour
uint16 - End hour
uint32 - Radius
uint8 - 1 = Buys stolen items (wording in CK is misleading)
uint8 - 1 = NOT sell/buy (causes vendor to buy/sell everything except what's in the Vendor List)
uint16 - Unused |
| - |  | PLVD |  | struct[12] | Where to sell goods
uint32 - Specification type
0 - Near Reference, REFR formID follows
1 - In Cell, CELL formID follows
2 - Near Package Start Location not used in original files
3 - Near Editor Location
6 - Linked Reference, KWYD formID follows not used in original files
12 - Near Self
formID - meaning depends on previous int
uint32 - Unused |
| - |  | CTDA |  | CTDA | Conditions, with leading CITC field. Vendor will only buy/sell when these conditions are met. |

## See Also

## Navigation menu

## Views

## Personal tools

## Search

## general

## Content

## Community

## Tools

