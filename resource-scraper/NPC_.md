# NPC_ Record Structure (UESP)

| C | SubRecord | Name | Type/Size | Info |
| --- | --- | --- | --- | --- |
| + | EDID | Editor ID | zstring | Editor ID |
| - | VMAD | Script Info | struct | Script info |
| + | OBND | Object Bounds | struct | Always 12 bytes, even if 0 |
| + | ACBS | Character Base Stats | struct | 24-byte struct
uint32 Flags
0x01 - Female
0x02 - Essential
0x04 - Is CharGen Face Preset
0x08 - Respawn
0x10 - Auto calc stats
0x20 - Unique
0x40 - Doesn't affect stealth meter
0x80 - PC Level Mult
0x100 - Audio template? (not displayed in CK)
0x800 - Protected
0x4000 - Summonable
0x10000 - Doesn't Bleed
0x40000 - owned/follow? (Horses, Atronachs, NOT Shadowmere; not displayed in CK)
0x80000 - Opposite Gender Anims
0x100000 - Simple Actor
0x200000 - looped script? AAvenicci, Arcadia, Silvia, Afflicted, TortureVictims
0x10000000 - looped audio? AAvenicci, Arcadia, Silvia, DA02 Cultists, Afflicted, TortureVictims
0x20000000 - Ghost/non-interactable (Ghosts, Nocturnal)
0x80000000 - Invulnerable
int16 - Magicka Offset
int16 - Stamina Offset
uint16 - Level (if PC Level Mult false) or [PC Level Multiplier]x1000 (if PC Level Mult true)
uint16 - Calc min level
uint16 - Calc max level
uint16 - Speed Multiplier
uint16 - Disposition Base
uint16 - Template Data Flags (controls which parts of NPC Record are overwritten by the template)
0x01 - Use traits (Destructible Object; Traits tab, including race, gender, height, weight, voice type, death item; Sounds tab; Animation tab; Character Gen tabs)
0x02 - Use stats (Stats tab, including level, autocalc, skills, health/magicka/stamina, speed, bleedout, class)
0x04 - Use factions (both factions and assigned crime faction)
0x08 - Use spelllist (both spells and perks)
0x10 - Use AI Data (AI Data tab, including aggression/confidence/morality, combat style and gift filter)
0x20 - Use AI Packages (only the basic Packages listed on the AI Packages tab; rest of tab controlled by Def Pack List)
0x40 - (unused?)
0x80 - Use Base Data (including name and short name, and flags for Essential, Protected, Respawn, Summonable, Simple Actor, and Doesn't affect stealth meter)
0x100 - Use inventory (Inventory tab, including all outfits and geared-up item -- but not death item)
0x200 - Use script
0x400 - Use Def Pack List (the dropdown-selected package lists on the AI Packages tab)
0x800 - Use Attack Data (Attack Data tab, including override from behavior graph race, events, and data)
0x1000 - Use keywords
int16 - Health Offset
uint16 - Bleedout Override |
| * | SNAM | Faction | struct | 8-byte struct
formid Faction (FACT)
int8 Rank - Few factions have RNAM entries for factions, so most are 0. Player factions are often -1.
int8[3] Unused |
| - | INAM | Death Item | formid | Death Item (LVLI) |
| - | VTCK | Voice Type | formid | Voice Type (VTYP) |
| - | TPLT | Template | formid | Base Template (NPC_ or LVLN) |
| + | RNAM | Race | formid | Race (RACE) |
| - | DEST | Destruction Data | struct | Destructible object data |
| - | SPCT | Spell Count | uint32 | Spell Count |
| * | SPLO | Spell | formid | Spell (SPEL) or shout (SHOU) |
| - | WNAM | Worn Armor | formid | Skin (e.g., SkinAtronachFrost, SkinDragonPriest) (ARMO) |
| - | ANAM | Away Model Name | formid | Far away model skin (ARMO) |
| - | ATKR | Attack Race | formid | Override from Behavior Graph (creatures mostly but some nords etc - prob for unarmed) (RACE) |
| * | ATKD | Attack Data | struct | 44-byte struct (same structure as RACE record): override racial attack data for a given attack event
float - Damage Mult
float - Attack Chance
formid - Attack Spell
uint32 - flags:
0x01 - Ignore Weapon
0x02 - Bash Attack
0x04 - Power Attack
0x08 - Left Attack
0x10 - Rotating Attack
float - Attack Angle
float - Strike Angle
float - Stagger
formid - Attack Type
float - Knockdown
float - Recovery Time
float - Fatigue Mult |
| * | ATKE | Attack Event | zstring | event name |
| - | SPOR | Spectator Override | formid | Spectator Override Package List (FLST) of (PACKs) |
| - | OCOR | Observe Corpse | formid | Observe Dead Body Override Package List (FLST) of (PACKs) |
| - | GWOR | Guard Warn Override | formid | Guard Warn Override Package List (FLST) of (PACKs) |
| - | ECOR | Combat Override | formid | Combat Override Package List (FLST) of (PACKs) |
| - | PRKZ | Perk Count | uint32 | Count of PRKR records |
| * | PRKR | Perk Record | struct | 8-byte struct
formid (PERK)
uint8 Rank (no longer in use)
uint8[3] Unused - junk data? |
| + | COCT | Count of Container | uint32 | Start of inventory - number of inventory "container" structures |
| * | CNTO | Container Object | struct | 8-byte struct
formid Any item formid (WEAP/ARMO/ALCH)
uint32 Count |
| - | COED | Owner | COED | See COED documentation |
| + | AIDT | AI Data | struct | 20 byte struct
uint8 Aggression
0x00 unaggressive
0x01 aggressive
0x02 very aggressive
0x03 frenzied
uint8 Confidence
0x00 cowardly
0x01 cautious
0x02 average
0x03 brave
0x04 foolhardy
uint8 Energy
uint8 Morality
0x00 any crime
0x01 violence against enemies
0x02 property crime only cicero at the farm is the only one thus far
0x03 no crime
uint8 Mood
0x00 Neutral (UNDEFINED)
0x01 Angry
0x02 Fear
0x03 Happy
0x04 Sad
0x05 Surprised
0x06 Puzzled
0x07 Disgusted
uint8 Assistance
0x00 helps nobody
0x01 helps allies
0x02 helps friends and allies
uint8 flags
0x01 Aggro Radius Behavior (enables the following three values in the CK)
uint8 unknown - data here sometimes, may be junk
uint32 Warn
uint32 Warn/Attack
uint32 Attack |
| * | PKID | AI Package | formid | AI package (PACK) |
| - | KSIZ | Keyword Count | uint32 | Count of keywords |
| - | KWDA | Keyword Data | formid[KSIZ] | Keywords |
| + | CNAM | Class | formid | Class (CLAS) |
| - | FULL | Full Name | lstring | Full (in-game) name |
| - | SHRT | Short Alias | lstring | if present used in Alias=? |
| + | DATA | Marker | 0-length | 0-length, presumably to mark DNAM position |
| + | DNAM | Skill/Stat Data | struct | 52-byte struct
18 × uint8 - Base skills in the following order
OneHanded,TwoHanded,Marksman,Block,Smithing,HeavyArmor,
LightArmor,Pickpocket,Lockpicking,Sneak,Alchemy,Speechcraft,
Alteration,Conjuration,Destruction,Illusion,Restoration,Enchanting
18 × uint8 - mod skill, same order as above
uint16 - calculated health (if auto-calc stats is on, otherwise seems to be random)
uint16 - calculated magicka (if auto-calc stats is on, otherwise seems to be random)
uint16 - calculated stamina (if auto-calc stats is on, otherwise seems to be random)
uint16 - unused?
float - Far Away Model Distance
uint8 - Geared Up Weapons
byte[3] - unused? |
| * | PNAM | Head Parts | formid | Head Part addons (hair, eyes, scars, etc) from HDPT |
| - | HCLF | Hair Color | formid | Hair color (CLFM) |
| - | ZNAM | Combat Style | formid | Combat style (CSTY) |
| - | GNAM | Gift Filter | formid | Gifts (FLST) |
| + | NAM5 | Unknown | short | flags or marker, "always" FF-00 |
| + | NAM6 | Height | float | NPC Height Multiplier |
| + | NAM7 | Weight | float | NPC Weight Multiplier |
| + | NAM8 | Sound Level | uint32 | enum
0 - Loud
1 - Normal
2 - Silent
3 - Very Loud |
| * | CSDT | Sound Type | uint32 | enum
0 - Idle
1 - Aware
2 - Attack
3 - Hit
4 - Death
5 - Weapon
6 - Movement Loop
7 - Conscious Loop |
| * | CSDI | Sound | formid | Reference to the sound to play.  Tied to the latest CSDT. |
| * | CSDC | Sound Chance | uint8 | Always follows a CSDI record.  Chance (0-100) that the sound will play on the triggering event. |
| - | CSCR | Audio Template | formid | Inherit Sound From: (NPC_) to use as an audio template |
| - | DOFT | Default Outfit | formid | Default Outfit (OTFT) |
| - | SOFT | Sleep Outfit | formid | Sleeping Outfit (OTFT) |
| - | DPLT | Default Package List | formid | Default Package List (FLST) |
| - | CRIF | Crime Faction | formid | Crime faction (FACT) |
| - | FTST | Face Texture Set | formid | Face complexion (TXST) |
| - | QNAM | Skin Tone | struct | 12-byte struct
float R / 255
float G / 255
float B / 255 |
| - | NAM9 | Face Morph Values | struct | 76-byte struct - 18 floats + 1 unknown. Listed below in order: |
|  | Nose Long/Short | float | -1 Short to 1 Long |  |
|  | Nose Up/Down | float | -1 Down to 1 Up |  |
|  | Jaw Up/Down | float | -1 Up to 1 Down |  |
|  | Jaw Narrow/Wide | float | -1 Narrow to 1 Wide |  |
|  | Jaw Forward/Back | float | -1 Back to 1 Forward |  |
|  | Cheeks Up/Down | float | -1 Down to 1 Up |  |
|  | Cheeks Forward Back | float | -1 Forward to 1 Back |  |
|  | Eyes Up/Down | float | -1 Down to 1 Up |  |
|  | Eyes In/Out | float | -1 In to 1 Out |  |
|  | Brows Up/Down | float | -1 Down to 1 Up |  |
|  | Brows In/Out | float | -1 In to 1 Out |  |
|  | Brows Forward/Back | float | -1 Back to 1 Forward |  |
|  | Lips Up/Down | float | -1 Down to 1 Up |  |
|  | Lips In/Out | float | -1 In to 1 Out |  |
|  | Chin Thin/Wide | float | -1 Thin to 1 Wide |  |
|  | Chin Up/Down | float | -1 Up to 1 Down |  |
|  | Chin Underbite/Overbite | float | -1 Overbite to 1 Underbite |  |
|  | Eyes Forward/Back | float | -1 Forward to 1 Back |  |
|  | unknown 4 bytes | 4 Bytes | Unknown Value: Only ever 00 00 00 00 or FF FF 7F 7F |  |
| * | NAMA | Face Parts | struct | Face part presets (numeric, starting from 0) |
|  | Nose | int32 | Nose |  |
|  | Unknown | int32? | Unknown, is set to -1 on most if not all humanoids |  |
|  | Eyes | int32 | Eyes |  |
|  | Mouth | int32 | Mouth |  |
| * | TINI | Tint Item | uint16 | Face Tint Layer (enumeration, values from 1 - 69) |
| - | TINC | Tint Color | uint8[4] rgba | Face Tinting Color - one after each TINI. Unclear if last byte is alpha. 00 in most records, FF in some. |
| - | TINV | Tint Value | int32 | 100 * Interpolation Value - one after each TINC |
| - | TIAS | Unknown | int16 | Unknown - one after each TINV (values from -1 - 1234) |

