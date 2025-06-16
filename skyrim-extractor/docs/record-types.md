# Skyrim Record Types

This document provides a comprehensive overview of Skyrim record types and their groupings. These record types are used in the plugin files (.esp/.esm) and can be filtered using the `recordTypeFilter` configuration option.

## Core Gameplay Records
- `PERK` - Perks that modify character abilities and stats
- `MGEF` - Magic Effects that define spell behaviors
- `SPEL` - Spells that combine magic effects
- `RACE` - Character races with their attributes
- `CLAS` - Character classes and their progression

## Item Records
- `ARMO` - Armor and clothing items
- `WEAP` - Weapons and their properties
- `ALCH` - Potions and alchemical items
- `INGR` - Ingredients for alchemy
- `BOOK` - Books, notes, and readable items
- `MISC` - Miscellaneous items
- `AMMO` - Arrows and bolts

## World Records
- `CELL` - Interior and exterior cells
- `WRLD` - World spaces and their properties
- `LAND` - Landscape data
- `NAVI` - Navigation meshes
- `WATR` - Water definitions
- `WTHR` - Weather systems

## Quest Records
- `QUST` - Quest definitions
- `DIAL` - Dialogue topics
- `INFO` - Dialogue responses
- `PACK` - AI packages and behaviors

## NPC Records
- `NPC_` - Non-player characters
- `FACT` - Factions and their relationships
- `RACE` - Character races
- `CLAS` - Character classes

## Object Records
- `CONT` - Containers (chests, barrels, etc.)
- `DOOR` - Doors and gates
- `FLOR` - Flora (plants, trees)
- `FURN` - Furniture and interactive objects
- `LIGH` - Light sources
- `STAT` - Static objects
- `TREE` - Tree definitions
- `ACTI` - Activators (buttons, levers)
- `TERM` - Terminals and computers

## Game Systems
- `GLOB` - Global variables
- `GMST` - Game settings
- `KYWD` - Keywords for object categorization
- `LSCR` - Loading screens
- `LTEX` - Landscape textures
- `MATT` - Material definitions
- `MESG` - Messages and notifications
- `MUSC` - Music tracks
- `SOUN` - Sound effects
- `TXST` - Texture sets

## Usage in Configuration

To filter specific record types, add them to the `recordTypeFilter` array in your `config.json`:

```json
{
  "recordTypeFilter": [
    "PERK",
    "MGEF",
    "SPEL"
  ]
}
```

### Common Filter Combinations

1. **Combat Focus**
   ```json
   "recordTypeFilter": [
     "WEAP",
     "ARMO",
     "PERK",
     "SPEL",
     "MGEF"
   ]
   ```

2. **Quest Content**
   ```json
   "recordTypeFilter": [
     "QUST",
     "DIAL",
     "INFO",
     "NPC_",
     "PACK"
   ]
   ```

3. **World Building**
   ```json
   "recordTypeFilter": [
     "CELL",
     "WRLD",
     "LAND",
     "NAVI",
     "STAT",
     "FURN",
     "CONT"
   ]
   ```

## Notes
- Record types are case-sensitive
- Some record types may be dependent on others (e.g., DIAL often requires QUST)
- Filtering record types can significantly improve processing speed
- Consider your analysis goals when selecting record types to filter 