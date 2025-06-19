# 🎮 Character Creation & Gameplay Record Types (Skyrim/xEdit)

This document lists key record types relevant to **character creation** and **core gameplay logic** in Skyrim modding (via ESM/ESP/ESL parsing). These records govern abilities, leveling, stats, and systemic mechanics used in character tools.

---

## 🧬 Character Creation Alpha Records

These records are foundational for building a character creation tool—defining race, class, skills, and passive effects (like standing stones).

### 📌 Essential Character Creation Records

| Record | Name             | Purpose                                                |
| ------ | ---------------- | ------------------------------------------------------ |
| `RACE` | Race             | Stats, movement, skills, appearance                    |
| `CLAS` | Class            | Governs skill focus and combat roles                   |
| `FACT` | Faction          | Starting allegiances, dialogue access                  |
| `PERK` | Perk             | Starting abilities, passive bonuses                    |
| `AVIF` | Actor Value Info | Core stats (e.g., health, stamina, carry weight)       |
| `MGEF` | Magic Effect     | Logic behind standing stones, passives, racial bonuses |
| `SPEL` | Spell            | Racial powers, innate abilities                        |
| `ENCH` | Enchantment      | Embedded gear-based passives, racial traits            |
| `GLOB` | Global Variable  | Used for controlling choice mechanics or UI state      |
| `FLST` | Form List        | Option groups for powers, races, stone powers          |

---

## 🧱 Core Gameplay Logic & Systemic Records

These records influence how a character progresses and interacts with the world over time.

### 📘 Progression & Mechanics

| Record | Name          | Purpose                                                        |
| ------ | ------------- | -------------------------------------------------------------- |
| `PERK` | Perk          | Passive or active abilities; progression systems               |
| `LVLN` | Leveled NPC   | NPCs/creatures by level                                        |
| `LVSP` | Leveled Spell | Spell lists scaling with level                                 |
| `LVLI` | Leveled Item  | Scaled loot, vendor stock, random rewards                      |
| `SKIL` | Skill         | (Obsolete) Used in earlier games, replaced by `AVIF` in Skyrim |

### 🎓 Learning & Training

| Record | Name       | Purpose                                              |
| ------ | ---------- | ---------------------------------------------------- |
| `NPC_` | NPC        | Includes trainers, skill-based leveling NPCs         |
| `QUST` | Quest      | Skill checks, training scripts, perk rewards         |
| `PACK` | AI Package | Training routines, idle actions, scheduled behaviors |
| `SCEN` | Scene      | Dialogue-driven events, sometimes for progression    |

### 🧠 Abilities & Powers

| Record | Name        | Purpose                                      |
| ------ | ----------- | -------------------------------------------- |
| `SPEL` | Spell       | All abilities and spells (active/passive)    |
| `MGEF` | MagicEffect | Underlying behavior logic for spells/perks   |
| `ENCH` | Enchantment | Gear-based effects (often passive abilities) |
| `SHOU` | Shout       | Dragon Shouts                                |

### 🎭 Role and AI Behavior

| Record        | Name         | Purpose                                      |
| ------------- | ------------ | -------------------------------------------- |
| `CSTY`        | Combat Style | Governs AI tactics and combat behavior       |
| `DIAL`/`INFO` | Dialogue     | Skill/perk/quest conditions in conversations |
| `EQUP`        | Equip Slot   | Equipment slot definitions                   |

### 🛠️ Technical & Modifier Records

| Record | Name      | Purpose                                           |
| ------ | --------- | ------------------------------------------------- |
| `GLOB` | Global    | Global variables used in quests, balancing, logic |
| `FLST` | Form List | Logic groupings of perks, spells, factions, etc.  |
| `ACTI` | Activator | Often used in skill-gated interactions            |
| `REFR` | Reference | May contain scripts affecting character logic     |

---

## 🔍 Filtering Tip

To isolate chore-level records in tools like xEdit:

```regex
PERK|MGEF|SPEL|LVLI|RACE|CLAS|FACT|AVIF|PACK|CSTY|GLOB|FLST
```

This captures core systemic gameplay data excluding art/audio/model content.

---

## ✅ Use Cases

- **Character creation interface tools**
- **Exporting perks, spells, and leveling data** for analysis
- **Building gameplay analyzers** or balance tools
- **Understanding progression trees** and class mechanics

---

For plugin developers, understanding these records is essential for adjusting balance, progression, or AI behavior without touching visuals or assets.
