# Wintersun Religion Documentation System

This directory contains the pipeline and configuration for generating comprehensive documentation for the Wintersun religion system.

## Overview

The religion documentation system processes Wintersun QUST (quest) data and SPEL (spell) records to create detailed documentation of all deities, their blessings, boons, and effects.

## Files

### Data Files

- `wintersun-qust.json` - Quest data containing deity properties and FormID references
- `wintersun-spel.json` - Spell records with detailed effect information
- `wintersun-mgef.json` - Magic effect records (if needed for additional detail)

### Configuration Files

- `religion-docs-config.yaml` - Configuration for the documentation generator
- `religion-docs.yaml` - Pipeline configuration for running the documentation generation

### Output Files

- `wintersun-religion-docs.json` - Generated comprehensive religion documentation

## Running the Documentation Generator

From the `parsing-pipeline` directory:

```bash
npm run religion-docs
```

This will:

1. Load the QUST data with deity information
2. Resolve spell FormIDs to get detailed effect information
3. Generate structured documentation with all deity details
4. Output the results to `wintersun-religion-docs.json`

## Configuration Options

The `religion-docs-config.yaml` file controls:

- **Output Format**: JSON, Markdown, or HTML
- **Grouping**: Group deities by type (Divine, Daedric Prince, etc.)
- **Sorting**: Sort deities alphabetically
- **Content**: Include blessings, boons, tenets, favored races
- **Effect Details**: Include spell effects, magnitudes, durations
- **Race Mapping**: Map FormIDs to readable race names
- **Type Descriptions**: Descriptions for each deity type

## Data Structure

The generated documentation includes:

### Deity Information

- Name and type
- Divine classification (Divine, Daedric Prince, Ancestor, etc.)
- Favored races
- Religious tenets

### Blessing System

- Spell FormID and name
- Effect details (magnitude, duration, description)
- Target attributes (Health, Magicka, Stamina, etc.)

### Boon System

- Two tiers of advanced benefits
- Unlock requirements
- Detailed effect descriptions

### Effect Analysis

- Combat bonuses
- Utility effects
- Restoration effects
- Social bonuses

## Integration

This documentation system integrates with:

- **SPEL Records**: For detailed spell and effect information
- **MGEF Records**: For magic effect mechanics
- **Race System**: For favored race relationships
- **Quest System**: For religious progression

## Example Output

```json
{
  "type": "Divine",
  "description": "The Nine Divines, the primary deities of the Imperial pantheon",
  "deities": [
    {
      "name": "Julianos",
      "type": "Divine",
      "blessing": {
        "spellId": "0x000FB996",
        "spellName": "Blessing of Julianos",
        "effects": [
          {
            "magnitude": 15,
            "duration": 86400,
            "effectName": "Restore Magicka",
            "effectDescription": "Restore <mag> points of Magicka",
            "targetAttribute": "Magicka"
          }
        ]
      },
      "favoredRaces": ["Altmer", "Bosmer"]
    }
  ]
}
```

## Next Steps

1. **Run the generator** to create initial documentation
2. **Review the output** for accuracy and completeness
3. **Customize configuration** as needed
4. **Generate additional formats** (Markdown, HTML) for different use cases
5. **Integrate with other systems** for comprehensive build guides
