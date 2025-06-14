# ARMO Record Structure (UESP)

*Source: [UESP - ARMO](https://en.uesp.net/wiki/Skyrim_Mod:Mod_File_Format/ARMO)*

| C | V | Field | Name | Type/Size | Info |
| --- | --- | --- | --- | --- | --- |
| + |  | EDID | editorID | zstring | Max ::0x200 bytes, including null terminator. |
| - |  | VMAD | scripting info | VMAD | scripting |
| - |  | OBND | object bounds | OBND | Always 12 bytes, even if all 0s |
| - |  | FULL | full name | lstring | Full (in-game) name |
| - |  | EITM | enchantment | formid | Enchanment (ENCH).  Note there can be only 1 of these. |
| - |  | EAMT | Enchantment Amount | uint16 | Enchantment Amount |
| - |  | MODL | model | MODL | Includes Fields MODB, MODT, MODS, MODD |
| + |  | MOD2 | male model | zstring | Male Models\ relative .nif |
| - |  | MO2T | model data | struct | (MODT) |
| - |  | MO2S | alternate textures | Alternate Textures | Used when overriding textures in a nif file with texture sets |
| - |  | ICON | Inventory Image | zstring | Inventory Image Filename |
| - |  | MICO | Message Image | zstring | Message Image Filename |
| - |  | MOD4 | female model | zstring | Female Models\ relative .nif |
| - |  | MO4T | model data | struct | (MODT) |
| - |  | MO4S | alternate textures | Alternate Textures | Used when overriding textures in a nif file with texture sets |
| - |  | ICO2 | Inventory Image | zstring | Female Inventory Image Filename |
| - |  | MIC2 | Message Image | zstring | Female Message Image Filename |
| + |  | BODT | Body Template | BODT | 8- or 12-byte struct Body Template |
| + | 1.6.91 | BOD2 | Body Template | BOD2 | 8-byte struct Body Template |
| - |  | DEST | destruction data | DEST | Includes Fields DSTD, DMDL, DMDT, DMDS |
| + |  | YNAM | pickupSound | formid | Sound(SNDR) played when picked up |
| + |  | ZNAM | dropSound | formid | Sound(SNDR) played when dropped |
| - |  | BMCT | Ragdoll | string | Ragdoll Constraint Template, not found in original (PC) datafiles |
| - |  | ETYP | equip slot | formid | EQUP (only shields) |
| - |  | BIDS | bash impact data set | formid | IPDS (only shields) |
| - |  | BAMT | bash material | formid | MATT (only shields) |
| + |  | RNAM | unknown | formID | RACE (0x19 DefaultRace for most except race-specific skins) |
| - |  | KSIZ | KSIZ | uint32 | keyword count |
| - |  | KWDA | KWDA | formID[KSIZ] | KYWD array |
| + |  | DESC | description | lstring | Usually 0 unless the enchantment isn't standard like Archmage Robes. |
| * |  | MODL | armature (model) | formid | Armature ARMA formid.  Required, can use more than 1 either as options (race options) or to cover multiple slots. |
| + |  | DATA | data | struct | 8-byte struct
uint32 Base value
float Weight |
| + |  | DNAM | armor rating | uint32 | Base armor rating * 100. (Note: despite being a uint32, only the lower uint16 is used.) |
| - |  | TNAM | template | formID | Points to another ARMO record to use as a template |

## Navigation menu

## Views

## Personal tools

## Search

## general

## Content

## Community

## Tools

