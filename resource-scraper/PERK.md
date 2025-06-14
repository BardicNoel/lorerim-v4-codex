# PERK Record Structure (UESP)

| C | Field | Name | Type/Size | Info |
| --- | --- | --- | --- | --- |
| + | EDID |  | zstring | EditorID |
| - | VMAD |  | struct | Script data |
| - | FULL |  | lstring | Perk Name |
| + | DESC |  | dlstring | Description |
| - | ICON |  | zstring | Inventory image filename |
| * | CTDA |  | struct | Zero or more condition data subrecords for the perk to be available to the player |
| + | DATA |  | struct | uint8[5]:
IsTrait
Level
NumRanks
IsPlayable
IsHidden |
| - | NNAM |  | formid | If present points to the next PERK |
| * |  |  | Perk Sections[] | See below. |

| C | Field | Name | Type/Size | Info |
| --- | --- | --- | --- | --- |
| + | PRKE |  | uint8[3] | uint8 - Type (See below for more details on the format of each section type)
00: perk section is Quest section
01: perk section is Ability section
02: perk section is Complex Entry Point section
uint8: Rank - Value of 0 = Rank 1
uint8: Priority - Assumed to be how to order/iterate through perk sections |
| - | PRKC |  | uint8 | Type - How to apply the conditions that follow. Has values of 0-2 but the actual values depend on the effect type. See the entry point EffectTypes for details.
Perk Owner
Target
Attacker
Attacker Weapon
Spell
Weapon
Item
Enchantment
Locked Reference |
| * | CTDA |  | struct | Condition data for the section |
| - | EPFT |  | uint8 | Type - The type of the perk data that follows in EPFD, EPF2, and EPF3 subrecords
01: EPFD is a float
02: EPFD is an 8 byte struct (float AV, float Factor)?
03: EPFD is a formid (?)
04:    	EPF2 = LString "verb" (feed) (optional)
EPF3 = dword? (0=No EPFD? or 3=SPEL EPFD?)
EPFD = formid (optional)
05: EPFD is a formid (SPEL)
06: EPFD is a zstring (GMST editorid?)
07: EPFD is a lstring (verb for custom activate actions) |
| - | EPF2EPF3EPFD |  |  | See EPFT |
| + | PRKF | Marker | null | Always the last subrecord in a perk section |

| C | Field | Name | Type/Size | Info |
| --- | --- | --- | --- | --- |
| + | PRKE |  | uint8[3] | Always: 0x00, 0x00, 0x00 |
| + | DATA | Quest ID | uint8[8] | formid: Quest ID
uint8: Stage
uint8[3]: Null - Has junk data, presumably unused |
| + | PRKF | Marker | null |  |

| C | Field | Name | Type/Size | Info |
| --- | --- | --- | --- | --- |
| + | PRKE |  | uint8[3] | Always: 0x01, 0x00, 0x00 |
| + | DATA | Quest ID | formid | Spell ID? - Unsure if it is always a spell |
| + | PRKF | Marker | null |  |

| C | Field | Name | Type/Size | Info |
| --- | --- | --- | --- | --- |
| + | PRKE |  | uint8[3] | Always: 0x02, 0x00, 0x00 |
| + | DATA |  | uint8[3] | EffectType - What effect to apply for the section (see below)
FunctionType - How to apply the effect? Affects what should be found in the EPFT/EPFD which follow (see below for more details)
CondTypeCount - Number of different type of conditions to test for (01, 02 or 03). This value is presumably fixed according to the effect type and probably shouldn't be edited. |
| * |  |  | Condition Subsections[] | (See below.) |
| + | EPFT |  | uint8 | DataType - Affects type of data that follows |
| ? | EPFD |  | variable | See the above details on EPFT for which subrecords should be found here and their format |
| ? | EPF2 |  | uint32 |  |
| ? | EPF3 |  | uint32 |  |
| + | PRKF | Marker | null |  |

| C | Field | Name | Type/Size | Info |
| --- | --- | --- | --- | --- |
| + | PRKC |  | uint8 | Condition type |
| * | CTDA |  | struct | Condition data for the subsection |

| Effect ID | Effect Type | Functions | Additional Data | Condition Types | Condition Type Count |
| --- | --- | --- | --- | --- | --- |
| 0E | Activate | Add Activate Choice | Button Label
Run Immediately
Replace Default
Apply Spell
Script Fragment? | Perk Owner (0) and Target (1) | 2 |
| 09 | Add Level List On Death | Add Level List | LevelListID | Perk Owner and Target | 2 |
| 05 | Adjust Book Skill Points 1 | All Value |  | Perk Owner | 1 |
| 04 | Adjust Limb Damage | All Value |  | Perk Owner, Attacker, Attacker Weapon | 3 |
| 34 | Apply Bashing Spell | Select Spell | SpellID | Perk Owner, Target | 2 |
| 33 | Apply Combat Hit Spell | Select Spell | SpellID | Perk Owner, Weapon, Target | 3 |
| 35 | Apply Reanimate Spell | Select Spell | SpellID | Perk Owner, Spell, Target | 3 |
| 45 | Apply Sneaking Spell | Select Spell | SpellID | Perk Owner | 1 |
| 43 | Apply Weapon Swing Spell | Select Spell | SpellID | Perk Owner, Attacker, Attacker Weapon | 3 |
| 03 | Calculate Mine Explode Chance | Value Types |  | Perk Owner, Item | 2 |
| 01 | Calculate My Critical Hit Chance | Value Types |  | Perk Owner, Weapon, Target | 3 |
| 02 | Calculate My Critical Hit Damage | Value Types |  | Perk Owner, Weapon, Target | 3 |
| 00 | Calculate Weapon Damage | Value Types |  | Perk Owner, Weapon, Target | 3 |
| 4B | Can Dual Cast Spell | Value Types |  | Perk Owner, Spell | 2 |
| 3D | Can Pickpocket Equipped Item | Value Types |  | Perk Owner, Target, Item | 3 |
| 4A | Filter Activation | Value Types |  | Perk Owner, Target | 2 |
| 0A | Get Max Carry Weight | Value Types |  | Perk Owner | 1 |
| 07 | Get Should Attack | Value Types |  | Perk Owner, Attacker | 2 |
| 10 | Ignore Broken Lock | Value Types |  | Perk Owner | 1 |
| 0F | Ignore Running During Detection | Value Types |  | Perk Owner | 1 |
| 41 | Make Lockpicks Unbreakable | Value Types |  | Perk Owner | 1 |
| 50 | Mod Number of Enchantments Allowed | Value Types |  | Perk Owner | 1 |
| 20 | Mod Armor Weight | Value Types |  | Perk Owner, Item | 2 |
| 23 | Mod Attack Damage | Value Types |  | Perk Owner, Weapon, Target | 3 |
| 1A | Mod Bashing Damage | Value Types |  | Perk Owner, Target | 2 |
| 2E | Mod Bribe Amount | Value Types |  | Perk Owner, Target | 2 |
| 2F | Mod Detection Light | Value Types |  | Perk Owner, Target | 2 |
| 30 | Mod Detection Movement | Value Types |  | Perk Owner, Target | 2 |
| 2D | Mod Favor Points | Value Types |  | Perk Owner, Target | 2 |
| 24 | Mod Incoming Damage | Value Types |  | Perk Owner, Attacker, Attacker Weapon | 3 |
| 2A | Mod Incoming Spell Duration | Value Types |  | Perk Owner, Spell | 2 |
| 29 | Mod Incoming Spell Magnitude | Value Types |  | Perk Owner, Spell | 2 |
| 21 | Mod Incoming Stagger | Value Types |  | Perk Owner, Attacker | 2 |
| 27 | Mod Percent Blocked | Value Types |  | Perk Owner | 1 |
| 2B | Mod Player Intimidation | Value Types |  | Perk Owner, Target | 2 |
| 2C | Mod Player Reputation | Value Types |  | Perk Owner | 1 |
| 53 | Mod Poison Dose Count | Value Types |  | Perk Owner, Weapon, Spell | 3 |
| 1C | Mod Power Attack Damage | Value Types |  | Perk Owner, Weapon, Target | 3 |
| 1B | Mod Power Attack Stamina | Value Types |  | Perk Owner, Weapon | 2 |
| 1F | Mod Secondary Value Weight | Value Types |  | Perk Owner, Spell, Target | 3 |
| 28 | Mod Shield Deflect Arrow Chance | Value Types |  | Perk Owner | 1 |
| 52 | Mod Shout OK | Value Types |  | Perk Owner | 1 |
| 4F | Mod Soul Gem Enchanting | Value Types |  | Perk Owner, Enchantment, Item | 3 |
| 31 | Mod Soul Gem Recharge | Value Types |  | Perk Owner, Item | 2 |
| 37 | Mod Spell Casting Sound Event | Value Types |  | Perk Owner, Spell | 2 |
| 26 | Mod Spell Cost | Value Types |  | Perk Owner, Spell | 2 |
| 1E | Mod Spell Duration | Value Types |  | Perk Owner, Spell, Target | 3 |
| 1D | Mod Spell Magnitude | Value Types |  | Perk Owner, Spell, Target | 3 |
| 25 | Mod Target Damage Resistance | Value Types |  | Perk Owner, Weapon, Target | 3 |
| 22 | Mod Target Stagger | Value Types |  | Perk Owner, Target | 2 |
| 0B | Mod Addiction Chance | Value Types |  | Perk Owner | 1 |
| 42 | Mod Alchemy Effectiveness | Value Types |  | Perk Owner | 1 |
| 55 | Mod Armor Rating | Value Types |  | Perk Owner, Item | 2 |
| 14 | Mod Bow Zoom | Value Types |  | Perk Owner, Weapon | 2 |
| 08 | Mod Buy Prices | Value Types |  | Perk Owner, Target | 2 |
| 44 | Mod Commanded Actor Limit | Value Types |  | Perk Owner, Spell | 2 |
| 39 | Mod Detection Sneak Skill | Value Types |  | Perk Owner, Target | 2 |
| 4D | Mod Enchantment Power | Value Types |  | Perk Owner, Enchantment, Item | 3 |
| 11 | Mod Enemy Critical Hit Chance | Value Types |  | Perk Owner, Weapon, Target | 3 |
| 3A | Mod Falling Damage | Value Types |  | Perk Owner | 1 |
| 57 | Mod Ingredients Harvested | Value Types |  | Perk Owner, Item | 2 |
| 48 | Mod Ingredient Effects Learned | Value Types |  | Perk Owner, Spell | 2 |
| 3E | Mod Lockpick Level Allowed | Value Types |  | Perk Owner | 1 |
| 3B | Mod Lockpick Sweet Spot | Value Types |  | Perk Owner, Locked Reference | 2 |
| 56 | Mod Lockpick Crime Chance | Value Types |  | Perk Owner, Locked Reference | 2 |
| 5A | Mod Lockpick Key Reward Chance (Wax Key) | Value Types |  | Perk Owner, Locked Reference | 2 |
| 13 | Mod Max Placeable Mines | Value Types |  | Perk Owner | 1 |
| 38 | Mod Pickpocket Chance | Value Types |  | Perk Owner, Target, Item | 3 |
| 46 | Mod Player Magic Slowdown | Value Types |  | Perk Owner, Spell | 2 |
| 0D | Mod Positive Chem Duration | Value Types |  | Perk Owner | 1 |
| 59 | Mod Potions Created (Create Duplicate Potion) | Value Types |  | Perk Owner, Spell | 2 |
| 15 | Mod Recover Arrow Chance | Value Types |  | Perk Owner | 1 |
| 06 | Mod Recovered Health | Value Types |  | Perk Owner | 1 |
| 3C | Mod Sell Prices | Value Types |  | Perk Owner, Target | 2 |
| 16 | Mod Skill Use | Value Types |  | Perk Owner | 1 |
| 12 | Mod Sneak Attack Multiplier | Value Types |  | Perk Owner, Weapon, Target | 3 |
| 4E | Mod Soul Percent Captured to Weapon | Value Types |  | Perk Owner, Target, Item | 3 |
| 58 | Mod Spell Range to Location | Value Types |  | Perk Owner, Spell | 2 |
| 19 | Mod Telekinesis Damage | Value Types |  | Perk Owner, Target | 2 |
| 18 | Mod Telekinesis Damage Multiplier | Value Types |  | Perk Owner | 1 |
| 17 | Mod Telekinesis Distance | Value Types |  | Perk Owner | 1 |
| 4C | Mod Tempering Health | Value Types |  | Perk Owner, Item | 2 |
| 47 | Mod Ward Magic Absorption Percent | Value Types |  | Perk Owner, Spell | 2 |
| 49 | Purify Alchemy Ingredients | Value Types |  | Perk Owner | 1 |
| 51 | Set Activate Label | SetText | Text | Perk Owner, Target | 2 |
| 36 | Set Boolean Graph Variable | SelectText | Text | Perk Owner | 1 |
| 3F | Set Lockpick Start Position | Value Types |  | Perk Owner | 1 |
| 40 | Set Progression Picking | Value Types |  | Perk Owner | 1 |
| 32 | Set Sweep Attack | Value Types |  | Perk Owner, Weapon | 2 |
| 54 | Should Apply Placed Item | Value Types |  | Perk Owner, Target, Item | 3 |

| Function ID | Function | New Value | EPFT | EPF2 | EPF3 | EPFD |
| --- | --- | --- | --- | --- | --- | --- |
| 01 | Set Value | VALUE | 0x01 |  |  | float VALUE |
| 02 | Add Value | Value + AMOUNT | 0x01 |  |  | float AMOUNT |
| 03 | Multiply Value | Value * FACTOR | 0x01 |  |  | float AMOUNT |
| 04 | Add Range to Value | Value + random(MIN, MAX) | 0x02 |  |  | float MIN, float MAX |
| 05 | Add Actor Value Mult | Value + AV * FACTOR | 0x02 |  |  | float AV, float FACTOR |
| 06 | Absolute | Abs(Value) |  |  |  |  |
| 07 | Negative ABS Value | -Abs(Value) |  |  |  |  |
| 08 | Add Level List (Only EffectType 0x09) |  | 0x03 |  |  | formid LevelListID |
| 09 | Add Activate Choice (Only EffectType 0x0E) |  | 0x04 | lstring (button label if present) | uint16 - Flags1:
0x01 = Run Immediately (No button label)
0x02 = Replace Default
uint16 - Flags2:
0x03 = Spell?
0x04 = Script Fragment? (Script fragment info added to record VMAD) | formid SpellID (if present) |
| 0A | Select Spell(Only EffectTypes 0x33, 0x34, 0x35, 0x43, 0x45) |  | 0x05 |  |  | formid SpellID |
| 0B | Select Text(Only EffectType 0x36) |  | 0x06 | zstring (usually a GMST editor ID?) |  |  |
| 0C | Set AV Mult | AV * FACTOR | 0x02 |  |  | float AV, float FACTOR |
| 0D | Multiply AV Mult | Value * AV * FACTOR | 0x02 |  |  | float AV, float FACTOR |
| 0E | Multiply 1 + AV Mult | Value * (1 + AV * FACTOR) | 0x02 |  |  | float AV, float FACTOR |
| 0F | Set Text(Only EffectType 0x51) |  | 0x07 |  |  | lstring |

