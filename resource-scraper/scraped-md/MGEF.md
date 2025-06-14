# MGEF Record Structure (UESP)

*Source: [UESP - MGEF](https://en.uesp.net/wiki/Skyrim_Mod:Mod_File_Format/MGEF)*

| C | V | Field | Name | Type/Size | Info |
| --- | --- | --- | --- | --- | --- |
| + |  | EDID | EditorID | zstring | Max 0x200 bytes, including null terminator. |
| - |  | VMAD | unknown | VMAD |  |
| - |  | FULL | name | lstring |  |
| - |  | MDOB | static | formID | Menu Display Object |
| - |  | KSIZ | keywordCount | uint32 |  |
| * |  | KWDA | keywords | formID[KSIZ.keywordCount] |  |
| + |  | DATA | data | struct[152] |  |
| 00:Flags | uint32 | Flags
0x00000001 = Hostile
0x00000002 = Recover
0x00000004 = Detrimental
0x00000008 = Snap to Navmesh
0x00000010 = No Hit Event
0x00000100 = Dispel Effects (toggle keywords to dispel type?)
0x00000200 = No Duration
0x00000400 = No Magnitude
0x00000800 = No Area
0x00001000 = FX Persist
0x00004000 = Gory Visual
0x00008000 = Hide in UI
0x00020000 = No Recast
0x00200000 = Power Affects Magnitude
0x00400000 = Power Affects Duration
0x04000000 = Painless
0x08000000 = No Hit Effect
0x10000000 = No Death Dispel
0x40000000 = ?
0x80000000 = ? |  |  |  |
| 04:Base Cost | float |  |  |  |  |
| 08:RelatedID | formID | The type of record here depends on the EffectType (see below). |  |  |  |
| 0C:Skill | int32 | Usually a base magic skill ActorValue (index) or -1 |  |  |  |
| 10:ResistanceAV | uint32 | Resistance skill index (generally 39-45) ActorValue (index) or -1 |  |  |  |
| 14:Unknown1 | uint32 | Mask of 0xffff0000 (lower 2 bytes always 0) |  |  |  |
| 18:LightID | formID | LIGH |  |  |  |
| 1C:TaperWeight | float | Somehow controls the tapering of the spell over time, 0-1 typically |  |  |  |
| 20:HitShader | formID | EFSH |  |  |  |
| 24:EnchantShader | FormID | EFSH |  |  |  |
| 28:SkillLevel | uint32 | Required Skill level (0, 25, 50, 75, 100) |  |  |  |
| 2C:Area | uint32 | 0 for none |  |  |  |
| 30:CastingTime | float | probably default if not provided, normal range 0.5-3 |  |  |  |
| 34:TaperCurve | float | Somehow affects the tapering of spell duration, 0-2 typically |  |  |  |
| 38:TaperDuration | float | Controls how fast the duration tapers off presumably, 0-5 typically |  |  |  |
| 3C:SecondAVWeight | float | Only valid if SecondAV is set, typical values of 0-2 |  |  |  |
| 40:EffectType | uint32 | The basic type of effect to apply (0-46). See below for effect type details. |  |  |  |
| 44:PrimaryAV | int32 | ActorValue (index) or -1.  Vast majority are 24 (direct health) |  |  |  |
| 48:ProjectileID | formID | PROJ |  |  |  |
| 4C:ExplosionID | formID | EXPL |  |  |  |
| 50:CastType | uint32 | cast type:
0x00 - Constant Effect
0x01 - Fire and Forget
0x02 - Concentration |  |  |  |
| 54:DeliveryType | uint32 | delivery type
0x00 - Self
0x01 - Touch
0x02 - Aimed
0x03 - Target Actor
0x04 - Target Location |  |  |  |
| 58:SecondAV | int32 | Secondary ActorValue (index) or -1 (usually only shock/frost have this) |  |  |  |
| 5C:CastingArtID | formID | Hand effects ARTO |  |  |  |
| 60:HitEffectArtID | formID | Impact effects ARTO (eg ward getting hit) |  |  |  |
| 64:ImpactDataID | formID | Impact data IPDS of projectiles |  |  |  |
| 68:SkillUsageMult | float | Typically 0-10 |  |  |  |
| 6C:DualCastID | formID | DUAL |  |  |  |
| 70:DualCastScale | float | 0-3 |  |  |  |
| 74:EnchantArtID | formID | ARTO |  |  |  |
| 78:NullData1 | uint32 | Always 0 |  |  |  |
| 7C:NullData2 | uint32 | Always 0 |  |  |  |
| 80:EquipAbility | formID | SPEL |  |  |  |
| 84:ImageSpaceModID | formID | IPDS |  |  |  |
| 88:PerkID | formID | PERK |  |  |  |
| 8C:SoundVolume | uint32 | 0-3
0 = Loud
1 = Normal
2 = Silent
3 = Very Loud |  |  |  |
| 90:ScriptAIDataScore | float | Unknown exact purpose, values of 0, 50, 9999, 100000, 1000000 |  |  |  |
| 94:ScriptAIDataDelayTime | float | Unknown exact purpose, values of 0, 60, 10000, 600000 |  |  |  |
| * |  | ESCE | CounterEffects | formid | Contain a magic effect formid that presumably counters the effects of the current one. |
| * |  | SNDD | soundData | list[struct[8]]
dword Type
formID SoundDesc | Array of structs, max 6 items. Sound types include:
0 = Draw/Sheathe
1 = Charge
2 = Ready
3 = Release
4 = Concentration Cast Loop
5 = On Hit |
| + |  | DNAM | Description | lstring | Effect description, e.g.: "Health regenerates <mag>% slower." |
| - |  | CTDA | conditionData | CTDA |  |

## Effect Types

## Navigation menu

## Views

## Personal tools

## Search

## general

## Content

## Community

## Tools

