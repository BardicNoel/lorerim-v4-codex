# QUST Record Structure (UESP)

*Source: [UESP - QUST](https://en.uesp.net/wiki/Skyrim_Mod:Mod_File_Format/QUST)*

## Contents

## Standard Fields

| C | SubRecord | Name | Type/Size | Info |
| --- | --- | --- | --- | --- |
| + | EDID | editorId | zstring | Editor id |
| - | VMAD | script info | VMAD | There is only VMAD field for the entire QUST record, which contains information about all of the scripts directly and indirectly attached to the quest (including stage-specific script fragments and scripts attached to the quests' aliases) |
| - | FULL | Quest Name | lstring | Full name as displayed in journal (at least for non-miscellaneous quests) |
| + | DNAM | Quest Data | struct[12] |  |
| Flags | uint8 | 0x01 = Start Game Enabled
0x02 Unused
0x04 = Wilderness Encounter (?)
0x08 = Allow repeated stages
0x10 Used but not shown in CK |  |  |
| Flags | uint8 | 0x01 = Run Once
0x02 = Exclude from dialogue export
0x04 = Warn on alias fill failure
0x08 Unused
0x10 Used but not shown in CK |  |  |
| Priority | uint8 | Value from 0 to 100 |  |  |
| Unknown | uint8 | Possibly just filler (Observed values are 0, 25, 101, 108, 111, and 204. Only 0 and 204 seen more than once) |  |  |
| Unknown | int32 | Always zero |  |  |
| Quest Type | uint32 | Possible Values:
0 = None (Quest does not appear in quest log)
1 = Main Quest
2 = Mages' Guild
3 = Thieves' Guild
4 = Dark Brotherhood
5 = Companion Quests
6 = Miscellaneous (Quest appears in Miscellaneous section of quest log; quest name is hidden and only quest objectives are shown to player)
7 = Daedric Quests
8 = Side Quests
9 = Civil War
10 = DLC01 - Vampire
11 = DLC02 - Dragonborn |  |  |
| - | ENAM | Event | char[4] | Corresponds with SMEN short name |
| * | QTGL | Unknown | formid | Text display globals. |
| + | FLTR | Object Window Filter | zstring | Values like 'Main Quest\', 'Civil War\', 'Civil War\Siege\', 'Faction\ThievesGuild\' and 'Faction\Companions\Radiant\' |
| * | CTDA | Quest Dialogue Conditions | struct[32] | Conditions that apply to the quest as a whole. |
| + | NEXT | Marker | empty | Always zero bytes in length.  Delineates between quest dialogue and quest event conditions when only one set of conditions exists. |
| * | CTDA | Quest Event Conditions | struct[32] | SM event node conditions. |
| * |  | Quest Stages | Quest Stages[] | See below. |
| * |  | Quest Objectives | Quest Objectives[] | See below. |
| + | ANAM | NextAliasId? | int32 | Next available alias ID. Acts as an incremental counter. This is used by CK when creating a new alias in ALST/ALLS field. |
| * |  | Aliases | Aliases[] | See below. |

## Quest Stages

| C | SubRecord | Name | Type/Size | Info |
| --- | --- | --- | --- | --- |
| * | INDX | Journal Index | struct | Journal index of the quest stage and other data |
| Index | int16 | Actual journal index of the quest stage |  |  |
| Flags | uint8 | Flag options:
0x02 - Start Up Stage
0x04 - Shut Down Stage
0x08 - Keep Instance Data From Here On |  |  |
| Unknown | int8 | Possibly filler. Nothing shown in CK corresponds to values found here. Values range from -110 to 127 and do not appear to be flags. |  |  |
| * |  | Quest log entries | Quest Log Entry[] | Multiple structures will appear if there are multiple possible quest log entries for the same stage. |

## Quest Log Entry

| C | SubRecord | Name | Type/Size | Info |
| --- | --- | --- | --- | --- |
| + | QSDT | Flags | ubyte | Each QSDT field marks the start of a log entry.QSDT contains quest stage flags:
0x01 - Complete Quest
0x02 - Fail Quest |
| * | CTDA | Conditions | struct[32] | Conditions that apply to this log entry. |
| - | CNAM | Journal entry | lstring | Index in the string file for the text of the journal entry. |
| - | NAM0 | Unknown | formid | Next quest. |
| - | SCHR | Old Script | SCHR | Old scripting field. |

## Quest Objectives

| C | SubRecord | Name | Type/Size | Info |
| --- | --- | --- | --- | --- |
| + | QOBJ | Index | int16 | Quest objective index.  The following fields all provide information about this quest objective.
By convention, the quest objective index normally corresponds to a quest stage index (i.e., a value in an INDX field), however, the relationship between quest stage index and quest objective index is merely a convention and is not enforced. The only thing that actually controls when an objective appears is the script attached to a quest stage. In some more complex quests, multiple objectives may be assigned as part of a single quest stage or the same quest objective can be assigned by multiple stages. |
| + | FNAM | Flags | int32 | Only flag option:
0x01 - ORed With Previous
(Note that FNAM also appears in ALST/ALLS section, where it has other possible values.) |
| + | NNAM | node name? | lstring | Text for an individual quest objective. |
| * |  | Quest Targets | Quest Target[] | Quest target information. |

## Quest Target

| C | SubRecord | Name | Type/Size | Info |
| --- | --- | --- | --- | --- |
| + | QSTA | Quest Target | struct[8] |  |
| Target Alias | int32 | Target for this quest objective, provided as an AliasID. |  |  |
| Flags | int32 | Flag for compass markers ignoring locks. - 0 = will not ignore, 1 = will ignore. |  |  |
| * | CTDA | Conditions | struct[32] | Conditions that apply to this QSTA. |

## Aliases

| C | SubRecord | Name | Type/Size | Info |
| --- | --- | --- | --- | --- |
| + | ALST | AliasID | uint32 | The AliasID is the numerical value used for this alias.  This is the parameter for functions such as LocAliasHasKeyword and GetInCurrentLocAlias.
ALST fields are used for Reference aliases (in the CK, "Ref" is listed in the Type column), whereas ALLS fields are used for Location aliases ("Loc" is listed in the CK's Type column).  In the CK, different editor screens are used for the two alias types, thereby controlling which fields can be associated with each type of alias. |
| ALLS | AliasID (Location) | uint32 |  |  |
| + | ALID | AliasName | zstring | The name of this Alias, for example Location or QuestGiver.  This name appears in strings that are dynamically updated based upon the quest details, for example Kill the leader of <Alias=Location>.  The calculated value of this alias is then substituted into the string. |
| + | FNAM | Flags | uint32 | Appears for all alias types. For reference aliases, in some cases (e.g., essential, protected), the flags are options assigned to the quest target for the duration of the quest. In other cases, the flags control how the alias is used during the quest.  Known flag options:


Bit
Applies To
Purpose


0x01
Loc/Ref
Reserves Location/Reference


0x02
Loc/Ref
Optional


0x04
Ref
Quest Object


0x08
Loc/Ref
Allow Reuse in Quest


0x10
Ref
Allow Dead


0x20
Ref
In Loaded Area (flag within the "Find Matching Reference" section, presumably limiting match to items in the loaded area)


0x40
Ref
Essential (makes the alias target essential for the duration of the quest)


0x80
Ref
Allow Disabled


0x100
Loc/Ref
Stores Text


0x200
Loc/Ref
Allow Reserved


0x400
Ref
Protected


0x800
Ref
No Fill Type


0x1000
Ref
Allow Destroyed


0x2000
Ref
Closest (flag within the "Find Matching Reference" section; only allowed if "In Loaded Area" selected.  Presumably limiting match to closest item in the loaded area)


0x4000
Ref
Uses Stored Text


0x8000
Ref
Initially Disabled


0x10000
Loc
Allow Cleared


0x20000
Ref
Clears Name When Removed |
|  |  |  |  |  |
| 0x01 | Loc/Ref | Reserves Location/Reference |  |  |
| 0x02 | Loc/Ref | Optional |  |  |
| 0x04 | Ref | Quest Object |  |  |
| 0x08 | Loc/Ref | Allow Reuse in Quest |  |  |
| 0x10 | Ref | Allow Dead |  |  |
| 0x20 | Ref | In Loaded Area (flag within the "Find Matching Reference" section, presumably limiting match to items in the loaded area) |  |  |
| 0x40 | Ref | Essential (makes the alias target essential for the duration of the quest) |  |  |
| 0x80 | Ref | Allow Disabled |  |  |
| 0x100 | Loc/Ref | Stores Text |  |  |
| 0x200 | Loc/Ref | Allow Reserved |  |  |
| 0x400 | Ref | Protected |  |  |
| 0x800 | Ref | No Fill Type |  |  |
| 0x1000 | Ref | Allow Destroyed |  |  |
| 0x2000 | Ref | Closest (flag within the "Find Matching Reference" section; only allowed if "In Loaded Area" selected.  Presumably limiting match to closest item in the loaded area) |  |  |
| 0x4000 | Ref | Uses Stored Text |  |  |
| 0x8000 | Ref | Initially Disabled |  |  |
| 0x10000 | Loc | Allow Cleared |  |  |
| 0x20000 | Ref | Clears Name When Removed |  |  |
| - | ALFI | Forced Into Alias | uint32 | AliasID of another alias to copy this alias into. |
| The following fields determine the alias' "Fill Type" (to use the CK terminology), i.e., they assign the alias' value.  Only one of the following fill-type fields (unindented) can appear in a given alias, along with any associated sub-fields (indented). |  |  |  |  |
| - | ALCO | Alias Created Object | formid | (Ref) Points to a base record for an item (NPC_, BOOK, MISC, LVLI, ARMO, KEYM, etc).  An instance of that object is then created and assigned to this alias.
Specified using "Create Reference to Object" section of CK editor; displayed as "Created" in Fill Type column. |
| + | ALCA | Create At | uint32 | High bit: 0 = Create At, 1 = Create InRemainder: AliasID to create object at/in. |
| + | ALCL | Create Level | uint32 | 0 = Easy1 = Medium2 = Hard3 = Very Hard4 = None |
| - | ALEQ | External Alias Reference | formid | (Loc/Ref) QUST records.  Provides the quest where the alias should be copied from; ALEA provides the AliasID in that quest that should be used.
Specified using "External Alias Reference" section of CK editor; display as "Match" in Fill Type Column. |
| + | ALEA | External Alias | uint32 | AliasID to be used in specified external quest. |
| - | ALFA | Reference Alias Location | uint32 | (Loc) AliasID of a reference alias within this quest. |
| - | KNAM | Keyword | formid | A single KYWD record. |
| - | ALFA | Location Alias Reference | uint32 | (Ref) AliasID of a location alias within this quest. |
| + | ALRT | Alias Reference Type | formid | Points to a LCRT record which is used to find the object that should be assigned to this alias.  This LCRT is looked up in the LCTN.LCSR field of the quest's assigned location to find a ACHR or REFR record that is then associated with this alias.
Specified using "Location Alias Reference" section of CK editor; displayed as "<Location>'s <Ref Type>" in Fill Type column. |
| - | ALFE | From Event | char[4] | (Loc/Ref) Provides the type of event (e.g. "Script").  Corresponds with SMEN short name.  ALFD field provides extra data about the event.
Specified using "Find Matching Location/Reference" section of CK editor and "From Event" checkbox; displayed as "Event" in Fill Type column. |
| + | ALFD | Event Data | char[4] | Corresponds to "Event Data" dropdown box in CK. Exact meaning of text varies based on event type. See CTDA documentation for more info. |
| - | ALFL | Alias Forced Location | formid | (Loc) A fixed LCTN record that should be assigned to this alias.  Also presumably becomes the default location record for this quest (used by any other alias records that need to look up location-specific items).
Specified using "Specific Location" section of CK editor; displayed as "Forced" in Fill Type column (even if "Force into Alias when Filled" is not selected). |
| - | ALFR | Alias Forced Reference | formid | (Ref) Points to an ACHR or REFR record corresponding to the object that should be assigned to this alias.
Specified using "Specific Reference" section of CK editor; displayed as "Forced" in Fill Type column. |
| - | ALNA | Near Alias | uint32 | (Ref) AliasID this one needs to be near to. |
| + | ALNT | Near Type | uint32 | Always 0: Linked Ref Child |
| - | ALUA | Alias Unique Actor | formid | (Ref) NPC_ record for an NPC assigned to this alias; uses an existing instance (ACHR record) of the NPC instead of creating a new one.  Presumably only works for NPCs with a unique ACHR.
Specified using "Unique Actor" section of CK editor; displayed as "UniqueActor" in Fill Type column.
This field is frequently used to identify the quest-giver, but it can also be used to assign an alias for any other NPC with a unique role in the quest. |
| * | CTDA | Match Conditions | struct[32] | (Loc/Ref) Conditions used to Find Matching Reference/Location.
Specified using "Find Matching Reference/Location" section of CK editor and filling in "Match Conditions"; displayed as "Condition" in Fill Type column. |
| - | KSIZ | KWDA count | uint32 | (Ref) Number of KWDA entries (size of KWDA is 4*KSIZ) |
| - | KWDA | Alias Keywords | formid[KSIZ] | KYWD records.  Keywords added to the alias for the duration of the quest. |
| - | COCT | CNTO count | uint32 | (Ref) If present, number of CNTO records.  Does not appear if there are no CNTO records and may not appear even when there are. |
| * | CNTO | Items | struct[8] | (Ref) Inventory-type item list.  These items are added to the inventory of the aliased object for the duration of the quest. |
| Item ID | formid |  |  |  |
| Item count | uint32 |  |  |  |
| - | SPOR | Spectator Override | formid | (Ref) Spectator Override Package List (FLST records). |
| - | OCOR | Observe Dead Body Override | formid | (Ref) Observe Dead Body Override Package List (FLST records). (Never used in main game files.) |
| - | GWOR | Guard Warn Override | formid | (Ref) Guard Warn Override Package List (FLST records). (Never used in main game files.) |
| - | ECOR | Combat Override | formid | (Ref) Combat Override Package List (FLST records). |
| - | ALDN | Display Name | formid | (Ref) Points to MESG record, whose value is then dynamically assigned as the displayed name of the Alias object.  Used to rename NPCs (e.g., Skyrim:Rigel Strong-Arm), quest rewards (e.g., Blade of Falkreath), or quest targets (e.g., Fine-Cut Void Salts) |
| * | ALSP | Alias Spells | formid | (Ref) SPEL records.  Spells added to the alias target for the duration of the quest. |
| * | ALFC | Alias Factions | formid | (Ref) FACT records.  Factions added to the alias target for the duration of the quest. |
| * | ALPC | Alias Package Data | formid | (Ref) PACK records.  Packages added to the alias target for the duration of the quest. |
| - | VTCK | Voice Type | formid | (Ref) "Additional Valid Voice Types for Export".  When non-zero points to NPC_ or FLST records |
| + | ALED | EOF Marker | empty | Marks the end of any given alias entry. |

| Bit | Applies To | Purpose |
| --- | --- | --- |
| 0x01 | Loc/Ref | Reserves Location/Reference |
| 0x02 | Loc/Ref | Optional |
| 0x04 | Ref | Quest Object |
| 0x08 | Loc/Ref | Allow Reuse in Quest |
| 0x10 | Ref | Allow Dead |
| 0x20 | Ref | In Loaded Area (flag within the "Find Matching Reference" section, presumably limiting match to items in the loaded area) |
| 0x40 | Ref | Essential (makes the alias target essential for the duration of the quest) |
| 0x80 | Ref | Allow Disabled |
| 0x100 | Loc/Ref | Stores Text |
| 0x200 | Loc/Ref | Allow Reserved |
| 0x400 | Ref | Protected |
| 0x800 | Ref | No Fill Type |
| 0x1000 | Ref | Allow Destroyed |
| 0x2000 | Ref | Closest (flag within the "Find Matching Reference" section; only allowed if "In Loaded Area" selected.  Presumably limiting match to closest item in the loaded area) |
| 0x4000 | Ref | Uses Stored Text |
| 0x8000 | Ref | Initially Disabled |
| 0x10000 | Loc | Allow Cleared |
| 0x20000 | Ref | Clears Name When Removed |

## Navigation menu

## Views

## Personal tools

## Search

## general

## Content

## Community

## Tools

