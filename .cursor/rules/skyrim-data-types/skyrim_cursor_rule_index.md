# 🗭 Skyrim xEdit Cursor Rule Index

This reference defines the main categories of information in plugin data useful for cursor-based parsing and rule creation in scripting.

---

## 1. 📘 Record Identity & Metadata

| Field      | Description                                |
|------------|--------------------------------------------|
| `Signature` | Record type identifier (e.g., `WEAP`, `NPC_`, `PERK`) |
| `FormID`   | Unique record identifier (mod + index)     |
| `EDID`     | Editor ID - script-friendly name           |
| `FULL`     | Display name seen in-game                  |

---

## 2. 🧹 Hierarchical & Relational Context

| Aspect         | Description                             |
|----------------|-----------------------------------------|
| Parent/Child   | Nested subrecords, containers, etc.     |
| `Referenced By`| Reverse links from other records        |
| `Contains`     | Direct child entries (e.g., items in containers or NPC inventories) |

---

## 3. 🎲 Inventory & Distribution

| Record Type | Field Path                        | Use                                 |
|-------------|-----------------------------------|--------------------------------------|
| `NPC_`      | `Items`                           | Weapons, armor, potions carried      |
| `CONT`      | `Items`                           | Loot containers                      |
| `LVLI`      | `Leveled List Entries`            | Distribution via leveled lists       |
| `REFR`      | `NAME`                            | Placed world objects                 |
| `ACHR`      | `NPC_` reference with inventory   | Placed actors with loot              |

---

## 4. 🔮 Gameplay Effects & Logic

| Record | Role                               |
|--------|------------------------------------|
| `PERK` | Perk-based logic and modifiers     |
| `SPEL` | Spells: bundles of magic effects   |
| `MGEF` | Magic effects with scripting logic |
| `ENCH` | Enchantments for weapons/armor     |
| `ABIL` | Passive bundled effects            |
| `AVIF` | Actor values (skills, stats)       |
| `QUST` | Quest conditions, distributions    |

---

## 5. 🍿 Classification & Tags

| Field    | Use                                              |
|----------|--------------------------------------------------|
| `KWDA`   | Keywords (e.g., `VendorItemPotion`)              |
| `BODT`   | Armor slot data                                  |
| `DATA`   | Core values (damage, weight, value, speed, etc.) |
| `DESC`   | Descriptive field (for traits, spells, etc.)     |

---

## 6. 🎨 Visual & Model Data

| Field   | Description                            |
|---------|----------------------------------------|
| `MODL`  | 3D model reference                      |
| `ICON`  | Inventory icon                          |
| `MICO`  | Misc icon (e.g., for powers)            |
| `RNAM`, `CNAM`, `XNAM` | Position, rotation, and reference data |

---

## 7. 🔗 Linked Records & Scripts

| Field   | Description                            |
|---------|----------------------------------------|
| `CNAM`, `PNAM`, `SNAM`, etc. | Cross-record references     |
| `VMAD`  | Papyrus script data and properties      |

