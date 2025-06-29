# Unique Enchanted Weapons

This document contains truly unique enchanted weapons that don't follow standard patterns. These weapons often have special names, unusual stats, multiple enchantment effects, or other distinctive characteristics.

{{#each weaponGroups as |weapons weaponType|}}

## {{weaponType}}

{{#each weapons}}
{{> unique_weapon_block }}
{{/each}}

{{/each}}

## Summary

- **Total Unique Weapons:** {{totalUniqueWeapons}}
- **Weapon Types:** {{weaponTypes.length}}
- **Generated:** {{generatedDate}}
