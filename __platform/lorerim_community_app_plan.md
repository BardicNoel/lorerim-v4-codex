# Lorerim Version 4 Codex

## 🎯 Purpose
The Lorerim Codex is a web-based companion for players of the Lorerim Wabbajack modlist for Skyrim SE. Its goal is to:

- Provide a structured, curated reference of gameplay-affecting elements relevant to character building and roleplay.
- Enable players to plan builds, understand character progression, and explore the mechanical landscape of Lorerim V4.
- Present meaningful, narrative-anchored data such as races, traits, spells, religions, weapons, and armors.

## 👥 Target Audience
- Skyrim players using the Lorerim modlist
- Build theorycrafters and hardcore character planners
- Players interested in exploring religions, races, perks, and gear from a roleplay or optimization lens

## 🙏 Credits
- **Biggie Boss** — creator and curator of the Lorerim modlist. This project builds on the structure and philosophy of Lorerim V4 as envisioned by Biggie Boss.

## 📚 Player Codex Scope (Phase 1)
- 🧬 Playable Races & Traits
- 🌀 Spells & Magic Schools
- 🛡️ Weapons & Armor
- 🧝 Perk Trees & Character Builds
- ☀️ Standing Stones & SkySigns
- 🛐 Religions from Wintersun
- 🧪 Alchemy: Lorerim-specific effects, known reagents, primers
- 🍳 Cooking: “Player cookbook” of crafted or found meals

## 🔧 Tech Stack Overview

### Frontend
- **React App** (hosted via **GitHub Pages**) — UI for browsing codex entries

### Backend API
- **Node.js + Express** — lightweight read-only API
- **Fly.io** (or **Render**) — free hosting for the backend
- **SQLite** — embedded database for fast lookup of curated Skyrim data

## 🔄 Data Pipeline
1. **Pascal Scripts in xEdit**
   - Extract raw records (PERK, SPELL, etc.)
   - Include metadata wrapper (plugin, load order, winning status)
   - Output JSON structured for easy SQLite import

2. **Raw Record Import**
   - Populate SQLite tables (`perks`, `spells`, etc.) with core fields + `data` JSON

3. **Local Logic Processing**
   - Analyze and tag records
   - Group into gameplay-relevant categories (e.g. racial traits, religion effects)

4. **Codex Entity Tables**
   - Populate `perk_tree_nodes`, `religion_effects`, etc.
   - Joinable or nested into the frontend API

5. **Frontend Usage**
   - React UI fetches logical entities and views
   - Players explore and compare options by game impact, not raw mod structure

## 🗺️ Core Features
- 🔍 Curated player codex: searchable by topic, not raw record ID
- 🔗 Cross-linked data: races → traits → perks → spells
- 📊 Build planner: view perk trees, standing stone effects, and religion bonuses
- 🍲 Interactive cookbook and alchemy primer for player crafting

## 🧱 Long-Term Goals
- 🛠️ Expand to modder-facing backend layer (data explorer)
- 📡 Enable direct data submission from modders (upload JSON blobs)
- 💾 Provide manually updated or scripted builds of Lorerim data
- 🧠 Visual diagrams (Mermaid) to show data relationships

## 🧮 SQLite Table Schemas (Hybrid Structure)
(See earlier for structured examples for perks, spells, races, etc.)

## 🧩 Logical Codex Entities (Derived Sets)
(See earlier for codex-oriented views like `racial_traits`, `religion_effects`, etc.)

---
Ready to begin implementing the record extraction schema or start post-processing one of the codex entity types?

