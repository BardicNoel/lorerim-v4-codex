# SMEN Record Structure (UESP)

*Source: [UESP - SMEN](https://en.uesp.net/wiki/Skyrim_Mod:Mod_File_Format/SMEN)*

| C | V | Field | Name | Type/Size | Info |
| --- | --- | --- | --- | --- | --- |
| - |  | EDID | Editor ID | zstring | (Only 1 with an edid.) |
| + |  | PNAM | unknown | formID? | Always 0x5B, SMBN with edid "Root" |
| + |  | SNAM | next? | formID | 0 or a reference to another SMEN formid. |
| + |  | CITC | CTDA count | uint32 | Count of CTDA entries. |
| * |  | CTDA | Condition Data | CTDA | CTDA records (CITC count). |
| + |  | DNAM | unknown | uint32? | Always 0. |
| + |  | XNAM | unknown | uint32? | Always 0. |
| + |  | ENAM | short name | char[4] | Event type code. |

## Event Type Codes

| Code | Event Type |
| --- | --- |
| ADCR | Crime Gold Event |
| ADIA | Actor Dialogue Event |
| AFAV | Player Activate Actor |
| AHEL | Actor Hello Event |
| AIPL | Player Add Item |
| ARRT | Arrest Event |
| ASSU | Assault Actor Event |
| BRIB | Bribe |
| CAST | Cast Magic Event |
| CHRR | Change Relationship Rank |
| CLOC | Change Location Event |
| CRFT | Craft Item |
| CURE | Player Cured |
| DEAD | Dead Body |
| ESJA | Escaped Jail |
| FLAT | Flatter |
| INFC | Player Infected |
| INTM | Intimidate |
| JAIL | Jail Event |
| KILL | Kill Actor Event |
| LEVL | Increase Level |
| LOCK | Lock Pick |
| NVPE | New Voice Power |
| PFIN | Pay Fine Event |
| PRFV | Player Recieves [sic] Favor |
| REMP | Player Remove Item |
| QSTR | Quest Start |
| SCPT | Script Event |
| SKIL | Skill Increase |
| STIJ | Served Time |
| TRES | Trespass Actor Event |

## Navigation menu

## Views

## Personal tools

## Search

## general

## Content

## Community

## Tools

