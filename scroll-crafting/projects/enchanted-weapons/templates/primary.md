# Enchanted Weapons

This document catalogs all enchanted weapons found in the mod data, organized by uniqueness and patterns. Unique weapons receive full documentation, while repetitive patterns are generalized for better readability.

## Unique Weapons

{{#each uniqueWeapons}}
{{> unique_weapon_block }}
{{/each}}

## Bound Weapon Manifestations

Bound and Mystic weapons are magical manifestations rather than physical weapons. They have no weight or value, but provide powerful magical capabilities.

### Bound Weapons

{{#each boundMysticWeapons}}
{{#if isBound}}
{{> bound_mystic_weapon_block }}
{{/if}}
{{/each}}

### Mystic Weapons

{{#each boundMysticWeapons}}
{{#unless isBound}}
{{> bound_mystic_weapon_block }}
{{/unless}}
{{/each}}

## Weapon Patterns

{{#each weaponPatterns}}
{{> weapon_pattern_block }}
{{/each}}

## Summary

- **Total Enchanted Weapons:** {{totalWeapons}}
- **Unique Weapons:** {{uniqueWeapons.length}}
- **Bound/Mystic Weapons:** {{boundMysticWeapons.length}}
- **Weapon Patterns:** {{weaponPatterns.length}}
- **Categories:** {{totalCategories}}
- **Generated:** {{generatedDate}}
