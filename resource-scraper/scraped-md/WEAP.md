# WEAP Record Structure (UESP)

*Source: [UESP - WEAP](https://en.uesp.net/wiki/Skyrim_Mod:Mod_File_Format/WEAP)*

| C | V | Field | Name | Type/Size | Info |
| --- | --- | --- | --- | --- | --- |
| - |  | BAMT | unknown | formID | Alternate block material. Points to a MATT. |
| - |  | BIDS | unknown | formID | Block bash impact data set. Points to a IPDS. |
| - |  | CNAM | template | formID | Points to another WEAP record to use as a template |
| ? |  | CRDT | Critical Damage | struct | 16 byte struct

uint16 - Critical Damage (0-13)
uint16 - Unused
float32 - Critical % Mult (0-1.5)
uint32 - Flags
0x01 Critical Effect on Death
formID - Critical Spell Effect (SPEL)
SSE version: 24 byte struct

uint16 - Critical Damage
uint16 - Unknown
float32 - Critical % Mult
uint32 - Flags
0x01 Critical Effect on Death
uint32 - Unknown
formID - Critical Spell Effect (SPEL)
uint32 - Unknown |
| + |  | DATA | data | struct[10] |  |
| value | int32 |  |  |  |  |
| weight | float |  |  |  |  |
| damage | int16 | Base damage. |  |  |  |
| + |  | DESC | description | lstring |  |
| + |  | DNAM | Weapon data | struct[100] |  |
| 00:Anim Type | uint8 | Lookup: 0=Other, 1=OneHandSword, 2=OneHandDagger, 3=OneHandAxe, 4=OneHandMace, 5=TwoHandSword, 6=TwoHandAxe, 7=Bow, 8=Staff, 9=Crossbow
0 is used by the "Unarmed" weapon, the weapon versions of the knife and fork, and the unpatched woodcutter's axe. |  |  |  |
| 01 | int8 | unknown |  |  |  |
| 02 | in16 | unknown |  |  |  |
| 04:Speed | float | Speed of weapon. |  |  |  |
| 08:Reach | float | For melee weapons, this is a multiplier used in the reach formula: fCombatDistance * NPCScale * WeaponReach (where fCombatDistance is a gamesetting). |  |  |  |
| 0C:Flags | uint16 | Flags.  Known flag values include:
0x01: Ignores Normal Weapon Resistance (probably an obsolete holdover from Oblivion)
0x02: Automatic
0x04: Has Scope
0x08: Can't Drop
0x10: Hide Backpack
0x20: Embedded Weapon
0x40: Don't Use 1st Person IS Animations (or Don't Use 3rd Person IS Animations -- always paired with 0x100 in third set of flags)
0x80: Unplayable (The checkbox display in the CK is "Playable", i.e. the inverse of this flag's value) |  |  |  |
| 0E:Flags? | uint16 | Possibly more flags, but has a constant value of 145 (0x91) in all records |  |  |  |
| 10:Sight FOV | float | (deprecated?) The angle of view when using Iron Sights. Done by zooming in. |  |  |  |
| 14:Blank | uint32 | 0 in all records |  |  |  |
| 18:VATS to hit | uint8 | Base VATS To-Hit Chance (possibly obsolete).  Only values are 0 and 5 |  |  |  |
| 19:Unknown | int8 | -1 in all records |  |  |  |
| 1A:Projectiles | uint8 | Number of projectiles per single ammo object (possibly obsolete).  1 in all records |  |  |  |
| 1B | int8 | Embedded Weapon: Actor Value, adding 46 to the stored value gives the actor value index, CK allows (0 PerceptionCondition through 6 BrainCondition), only valid if Embedded Weapon flag is set |  |  |  |
| 1C:Min Range | float | Tells combat AI they don't need to be closer than this value. |  |  |  |
| 20:Max Range | float | Tells combat AI they don't want to be any further away than this value. |  |  |  |
| 24:Unknown | uint32 | 0 in all records |  |  |  |
| 28:Flags | uint32 | Flags.  Known flag values include:
0x01: Player Only
0x02: NPCs Use Ammo
0x04: No Jam After Reload
0x10: Minor Crime
0x20: Fixed Range
0x40: Not Used in Normal Combat
0x100: Don't Use 3rd Person IS Animations (or Don't Use 1st Person IS Animations -- always paired with 0x40 in first set of flags)
0x200: Burst Shot
0x400: Alternate Rumble
0x800: Long bursts
0x1000: Non-hostile
0x2000: Bound Weapon |  |  |  |
| 2C:Unknown | float | 1 in all records |  |  |  |
| 30:Unknown | float | Values range from 0.1 to 5, but is not displayed in CK |  |  |  |
| 34:Rumble left | float | Rumble: left motor strength |  |  |  |
| 38:Rumble right | float | Rumble: right motor strength |  |  |  |
| 3C:Rumble duration | float | Rumble: duration |  |  |  |
| 40:Blank | uint32 | 0 in all records |  |  |  |
| 44:Blank | uint32 | 0 in all records |  |  |  |
| 48:Blank | uint32 | 0 in all records |  |  |  |
| 4C:Skill | int32 | Skill governing weapon's use (for staves, this is a magic skill, not a weapon skill, but apparently ignored in that case).  Provided as an actor value; -1 for weapons without a governing skill |  |  |  |
| 50:Blank | uint32 | 0 in all records |  |  |  |
| 54:Blank | uint32 | 0 in all records |  |  |  |
| 58:Resist | int32 | Actor Value, CK allows 39 DamageResist through 44 MagicResist or -1 for None (always -1 in original files) |  |  |  |
| 5C:Blank | uint32 | 0 in all records |  |  |  |
| 60:Stagger | float | Stagger |  |  |  |
| - |  | EAMT | Enchantment Charge Amount | uint16 |  |
| + |  | EDID | editorID | zstring | Max 0x200 bytes, including null terminator. |
| - |  | EITM | Enchantment | formID | Points to a ENCH. |
| - |  | ETYP | Equip Type | formID | Specifies which equipment slot is used by the weapon (typically "BothHands" or "EitherHand"). Points to a EQUP. |
| + |  | FULL | Name | lstring |  |
| - |  | INAM | unknown | formID | Normal weapon swing impact set. Points to a IPDS. |
| - |  | KSIZ | keywordCount | uint32 |  |
| - |  | KWDA | keywords | formID[KSIZ.keywordCount] |  |
| + |  | OBND | objectBounds | OBND |  |
| + |  | MODL | Model File Name | zstring |  |
| - |  | MODS | Alternate textures | Alternate Textures | Used when overriding textures in a nif file with texture sets |
| - |  | MODT | unknown | Model Textures |  |
| - |  | NAM7 | unknown | formID | Attack Loop Sound (SNDR) Not found in original files |
| - |  | NAM8 | unknown | formID | UnEquip Sound (SNDR) |
| - |  | NAM9 | unknown | formID | Equip Sound (SNDR). |
| - |  | NNAM | unknown | zstring | Embedded Weapon Node |
| - |  | SNAM | unknown | formID | Attack Sound (Trap Fire) (SNDR) |
| - |  | TNAM | unknown | formID | Attack Fail Sound (SNDR). |
| - |  | UNAM | unknown | formID | Idle Sound (SNDR) |
| - |  | VMAD | unknown | VMAD |  |
| + |  | VNAM | Sound Detection Level | uint32 | The amount of sound using the weapon generates, seems to be used in determining nearby NPCs detection of the actor using the weapon. 2(0x02) = Silent, 1(0x01) = Normal, 0(0x00) = Loud, 3(0x03) = Very Loud. |
| - |  | WNAM | unknown | formID | 1st Person Model Object. Points to a STAT. Affects the Inventory Item display. |
| - |  | XNAM | unknown | formID | Attack Sound (2D) (SNDR) found in Dawnguard.esm |
| - |  | YNAM | unknown | formID | Pickup Sound (SNDR) not found in original files |
| - |  | ZNAM | unknown | formID | Putdown Sound (SNDR) not found in original files |

## Notes

## Navigation menu

## Views

## Personal tools

## Search

## general

## Content

## Community

## Tools

