# RELA Record Structure (UESP)

*Source: [UESP - RELA](https://en.uesp.net/wiki/Skyrim_Mod:Mod_File_Format/RELA)*

| C | SubRecord | Name | Type/Size | Info |
| --- | --- | --- | --- | --- |
| + | EDID | editorId | zstring | Editor id |
| + | DATA | Data | struct[16] |  |
| Parent NPC | formid | Parent/child here does not necessarily mean biological parent/child; it's just a generic way of describing two connected items. |  |  |
| Child NPC | formid |  |  |  |
| Rank | uint16 | Relationship Level.  The value stored in the game data is unsigned integer ranging from 0 to 8 (although 7 is the highest value being used so far).  However, this is converted into a value ranging from -4 to 4, which is the value returned by GetRelationshipRank; negative values imply dislike/hatred whereas positive values are for friendship.  The meaning assigned to each value in the CK is (the first number is the raw value in the game data; the second number is the GetRelationshipRank value):
0 - Lover (4)
1 - Ally (3)
2 - Confidant (2)
3 - Friend (1)
4 - Acquaintance (0)
5 - Rival (-1)
6 - Foe (-2)
7 - Enemy (-3)
8 - Archnemesis (-4) |  |  |
| Flag | uint16 | The only bit set in this flag is the highest bit:
0x8000 - Secret |  |  |
| Association Type | formid | Formid to a ASTP record, which provides additional information about the association between the two people.
Can be empty, in which case no additional information is available. |  |  |

## Navigation menu

## Views

## Personal tools

## Search

## general

## Content

## Community

## Tools

