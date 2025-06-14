# TES4 Record Structure (UESP)

*Source: [UESP - TES4](https://en.uesp.net/wiki/Skyrim_Mod:Mod_File_Format/TES4)*

| C | Field | Type/Size | Info |
| --- | --- | --- | --- |
| + | HEDR | struct(12 bytes) | Header
float32 - Version (0.94 for older files; 1.7 for more recent ones).
uint32 - Number of records and groups (not including TES4 record itself).
uint32 - Next available object ID. |
| - | CNAM | zstring | Author
Max size: 512 bytes (including terminator). |
| - | SNAM | zstring | Description
Max size: 512 bytes (including terminator). |
| * | MAST | zstring | Master filename.
Each pair of MAST/DATA subrecords represent a single master of the mod file.
Master files are listed in load order at the time the mod was saved.
The modindex of formids in the mod file match the order of masters given here. |
| DATA | uint64 | Always 0. May be vestigial.
In Tes3, the file size of the master was recorded here. In Tes4, the size code seems to be in place, but is not functioning and may either be bugged or conditioned out at a low level. |  |
| - | ONAM | formid[] | Overridden forms
This record only appears in ESM flagged files which override their masters' cell children.
An ONAM subrecord will list, exclusively, FormIDs of overridden cell children (ACHR, LAND, NAVM, PGRE, PHZD, REFR).
Observed in Update.esm as of Patch 1.5.24.
Number of records is based solely on field size. |
| + | INTV | uint32 | Number of strings that can be tagified (used only for TagifyMasterfile command-line option of the CK). |
| - | INCC | uint32 | Some kind of counter. Appears to be related to masters.
Introduced with the Skyrim 1.6 update in Update.esm. |

## Navigation menu

## Views

## Personal tools

## Search

## general

## Content

## Community

## Tools

