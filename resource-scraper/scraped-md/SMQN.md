# SMQN Record Structure (UESP)

*Source: [UESP - SMQN](https://en.uesp.net/wiki/Skyrim_Mod:Mod_File_Format/SMQN)*

| C | V | Field | Name | Type/Size | Info |
| --- | --- | --- | --- | --- | --- |
| - |  | EDID | Editor ID | zstring |  |
| + |  | PNAM | Parent | formID | Reference to parent SMQN, SMBN or SMEN |
| + |  | SNAM | sibling | formID | 0 (If first child) or reference to prior sibling |
| + |  | CITC | CTDA count | uint32 | Count of CTDA entries |
| * |  | CTDA | Condition Data | CTDA | CTDA records (CITC count) |
| - |  | CIS2 | variable name | zstring | Optional variable name eg "::playerAllegiance_var" may be passed to next CTDA only? |
| + |  | DNAM | flags | uint32 | Flags, 0x01 and also very large (0x10000, 0x100000) |
| + |  | XNAM | unknown | uint32? | Always 0 |
| + |  | QNAM | NNAM count | uint32 | Count of NNAM (QUST) entries |
| * |  | NNAM | Quest node | formID | QUST formids (QNAM count, each optionally followed by RNAM) |
| * |  | RNAM | reset time | float | Hours[verification needed] till reset CK shows value divided by 24 labeled as hours till reset, but that should probably be days |

## Navigation menu

## Views

## Personal tools

## Search

## general

## Content

## Community

## Tools

