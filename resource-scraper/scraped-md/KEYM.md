# KEYM Record Structure (UESP)

*Source: [UESP - KEYM](https://en.uesp.net/wiki/Skyrim_Mod:Mod_File_Format/KEYM)*

| C | V | Field | Name | Type/Size | Info |
| --- | --- | --- | --- | --- | --- |
| + |  | EDID | editorID | zstring | Record Editor ID |
| - |  | VMAD | script data | VMAD | Script Data |
| + |  | OBND | objectBounds | OBND | Always 12 bytes even if all 0s |
| + |  | FULL | itemName | lstring | Full (in-game) item name |
| - |  | MODL | model | zstring | World model filename |
| - |  | MODT | model data | struct[] | series of 12-byte structs (assume xyz) |
| - |  | YNAM | pickupSound | formid | Sound (SNDR) played when picked up |
| - |  | ZNAM | dropSound | formid | Sound (SNDR) played when dropped |
| - |  | KSIZ | numKeywords | KSIZ | KYWD Count. |
| - |  | KWDA | keywords | KWDA | [KYWD 0x000914EF] VendorItemKey |
| + |  | DATA | item data | struct | 8 bytes
uint32 Value
float Weight |

## Navigation menu

## Views

## Personal tools

## Search

## general

## Content

## Community

## Tools

