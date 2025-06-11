# Excluded Fields by Record Type

This document defines which fields should be excluded from the `data` JSON export during raw record extraction. These exclusions help reduce file size and remove non-essential information for the Lorerim Codex.

## Universal Exclusions
The following fields should be excluded from ALL record types:
- `Data Size` (Record Header)
- `Version Control Info 1` (Record Header)
- `Version Control Info 2` (Record Header)
- `Form Version` (Record Header)
- Any flags or fields that are consistently zeroed or hex-filled with no gameplay reference
- Any null fields (fields that contain no meaningful data)

## Condition Field Exclusions
The following fields should be excluded from ALL condition records (CTDA):
- `Unused` (appears in multiple places, always contains hex data)
- `Parameter #2` when value is "00 00 00 00" (empty/default value)
- Any parameter fields that contain only hex data with no meaningful reference

---

## NPC_ (Non-Player Character)
- `Model`
- `Head Parts`
- `Texture Sets`
- `Animations`

## ARMO (Armor)
- `Model`
- `Male world model`
- `Female world model`

## WEAP (Weapons)
- `Model`
- `Weapon Art`

## RACE (Playable Race)
- `Face Gen Data`
- `Head Parts`
- `Hair`
- `Combat Style`

## CELL (World Cells)
- `Lighting`
- `XCLL`
- `Path Grid`

## WRLD (Worldspaces)
- `Map Data`
- `World Map Offset`

## SPEL (Spells)
- *(no exclusions yet)*

## PERK (Perks)
- `PRKF - End Marker` (Effects)
- Empty/Default condition parameters
- Unused condition fields
- Any condition fields that only contain hex data with no meaningful reference

## MGEF (Magic Effects)
- *(no exclusions yet)*

---

This list will be used to guide dynamic filtering logic in the Pascal export script. You can expand or override entries as needed during codex refinement.

