# Enchanted Weapons Index

This is the main index for all enchanted weapons documentation. The weapons have been organized into separate documents based on their characteristics and usage.

## Document Categories

### [Unique Enchanted Weapons](unique-weapons.md)

Truly unique weapons that don't follow standard patterns. These often have special names, unusual stats, multiple enchantment effects, or other distinctive characteristics.

**Count:** {{uniqueWeapons.length}} weapons

### [Generic Weapon Enchantments](generic-weapon-enchants.md)

Weapon patterns - groups of weapons that follow similar material + weapon type + enchantment combinations. These represent the standard enchanted weapons found throughout the world.

**Count:** {{weaponPatterns.length}} patterns, {{totalPatternWeapons}} weapons

### [Bound Weapon Manifestations](bound-weapons.md)

Magical weapon manifestations rather than physical weapons. They have no weight or value, but provide powerful magical capabilities.

**Count:** {{boundMysticWeapons.length}} weapons

### [Wands and Staves](wands-staves.md)

Enchanted wands and staves - magical implements that serve as both weapons and spellcasting tools.

**Count:** {{wandStaffWeapons.length}} weapons

## Overall Summary

- **Total Weapons Processed:** {{totalWeapons}}
- **Unique Weapons:** {{uniqueWeapons.length}}
- **Pattern Weapons:** {{totalPatternWeapons}}
- **Bound/Mystic Weapons:** {{boundMysticWeapons.length}}
- **Wands and Staves:** {{wandStaffWeapons.length}}
- **Generated:** {{generatedDate}}

## Data Files

- [All Weapons JSON](enchanted-weapons.json) - Complete dataset
- [Unique Weapons JSON](unique-weapons.json) - Unique weapons only
- [Weapon Patterns JSON](weapon-patterns.json) - Pattern analysis data
- [Bound/Mystic Weapons JSON](bound-mystic-weapons.json) - Bound and mystic weapons
- [Wands and Staves JSON](wands-staves.json) - Wands and staves data
