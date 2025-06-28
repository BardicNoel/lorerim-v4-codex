# Base Weapon Templates

This document lists all base weapon templates found in the game. These are unenchanted base weapons that can be used as templates for creating enchanted weapons.

**Generated:** {{generatedDate}}

## Template Overview

Base weapon templates are the foundation weapons that can be enchanted to create general enchanted weapons. These templates represent the base weapon types available in the game.

{{#each baseWeaponTemplates}}

## {{templateName}}

- **Template FormID:** {{cnamFormId}}
- **Weapon Type:** {{weaponType}}
- **Base Damage:** {{baseDamage}}
- **Weight:** {{weight}}
- **Value:** {{value}}
  {{#if material}}- **Material:** {{material}}{{/if}}
- **Usage Count:** {{count}} weapons

---

{{/each}}

## Summary

This document shows {{baseWeaponTemplates.length}} base weapon templates that serve as the foundation for creating enchanted weapons. These templates represent the unenchanted base weapons that can be found or crafted in the game.
