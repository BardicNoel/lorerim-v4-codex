# SMBN Record Structure (UESP)

*Source: [UESP - SMBN](https://en.uesp.net/wiki/Skyrim_Mod:Mod_File_Format/SMBN)*

| C | V | Field | Name | Type/Size | Info |
| --- | --- | --- | --- | --- | --- |
| + |  | EDID | Editor ID | zstring | all records have |
| + |  | PNAM | Parent | formid | Reference to parent SMBN, SMQN or SMEN |
| + |  | SNAM | Sibling | formid | 0 (If first child) or reference to prior Sibling |
| + |  | CITC | CTDA count | uint32 | Count of CTDA entries |
| * |  | CTDA | Condition Data | CTDA | CTDA records (CITC count) |
| - |  | CIS2 | variable name | zstring | Optional variable name eg "::playerAllegiance_var" |
| + |  | DNAM | flags? | uint32? | Flags, only 0x00, 0x01 seen |
| + |  | XNAM | unknown | uint32? | Always 0 |

## Navigation menu

## Views

## Personal tools

## Search

## general

## Content

## Community

## Tools

