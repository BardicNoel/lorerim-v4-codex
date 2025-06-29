# Traits System Documentation

## Overview
The traits system provides character customization options through a set of special abilities, bonuses, and characteristics that can be applied to a character. This document outlines the technical implementation and relationships between different record types that compose the trait system.

## Record Relationships

### Core Records
1. PERK Records
   - Primary container for trait definitions
   - Contains effect data and requirements
   - Links to other records via FormIDs

2. SPEL Records
   - Spell effects associated with traits
   - May be applied when traits are active
   - Contains MGEF references

3. MGEF Records
   - Defines actual effects and their parameters
   - Contains description text and mechanics

### Support Records
1. KYWD Records
   - Used for trait categorization
   - Helps organize traits into groups
   - May indicate special trait types

2. GLOB Records
   - Global values used by traits
   - May control trait mechanics

3. AVIF Records
   - Actor values affected by traits
   - Used in effect calculations

## Data Resolution Flow
1. Load trait PERK records
2. Resolve associated SPEL records
3. Extract MGEF descriptions and effects
4. Apply KYWD categorization
5. Link GLOB and AVIF references
6. Generate final trait definitions

## Implementation Notes
- Traits must be uniquely identifiable
- Effects should be clearly described
- Categories must be consistently applied
- Prerequisites must be validated
- Consider performance implications of cross-record resolution

## Future Considerations
- Web API compatibility
- GPT consumption format
- Expansion capabilities
- Documentation updates
