# General Weapon Enchantments

This document lists all enchantments that can be applied to general weapons. These enchantments are commonly found on templated weapons throughout the game.

**Generated:** {{generatedDate}}  
**Total General Weapons:** {{totalGeneralWeapons}}

## Enchantment Overview

General weapon enchantments are magical effects that can be applied to any compatible weapon template. These enchantments provide various magical properties and effects.

{{#each generalWeaponEnchantments}}

## {{name}}

- **Enchantment Cost:** {{cost}}
- **Charge Amount:** {{chargeAmount}}
- **Usage Count:** {{count}} weapons
- **Description:** {{description}}

### Effects

{{#each effects}}

- **{{name}}:** {{description}}
  - Magnitude: {{magnitude}}
  - Duration: {{duration}}
  - Area: {{area}}
    {{/each}}

### Example Weapons

{{#each examples}}

- {{this}}
  {{/each}}

---

{{/each}}

## Summary

This document shows {{generalWeaponEnchantments.length}} general enchantments that can be applied to weapon templates. These enchantments provide a wide variety of magical effects and can be found on weapons throughout the game world.
