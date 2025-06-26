# Standing Stones Logic

## Overview
Standing Stones in Skyrim provide permanent blessings to the player character. Each stone grants specific abilities or bonuses that remain active until another stone is chosen.

## Record Type
- **STON**: Standing Stone records

## Key Fields
- **name**: Display name of the standing stone
- **edid**: Editor ID for the stone
- **formid**: Form ID for database linking
- **description**: Detailed description of the stone's blessing
- **location**: Geographic location in Skyrim (optional)
- **effects**: Array of specific effects granted (optional)

## Standing Stone Categories

### Guardian Stones (Starting Stones)
- The Warrior Stone
- The Mage Stone  
- The Thief Stone

### Ritual Stones
- The Lover Stone
- The Steed Stone
- The Lady Stone
- The Lord Stone
- The Atronach Stone
- The Apprentice Stone
- The Tower Stone
- The Shadow Stone

### Special Stones
- The Serpent Stone
- The Ritual Stone

## Data Structure
Each standing stone should include:
1. Basic identification (name, edid, formid)
2. Description of the blessing
3. Location information for player reference
4. Specific effects for detailed analysis

## Generation Logic
1. Load STON records from Skyrim data
2. Extract relevant fields for documentation
3. Organize by category (Guardian, Ritual, Special)
4. Generate markdown documentation
5. Export JSON for web integration

## Template Structure
- Primary template lists all stones
- Individual stone blocks show detailed information
- Include location and effects when available 