# General Weapon Templates

This document lists all general weapon templates found in the game. These are base weapons that can be enchanted with various enchantments.

**Generated:** {{generatedDate}}  
**Total General Weapons:** {{totalGeneralWeapons}}

## Template Overview

General weapons are created by applying enchantments to base weapon templates. Each template represents a specific weapon type and material that can be found with various enchantments.

{{#each generalWeaponTemplates}}

## {{templateName}}

- **Template FormID:** {{cnamFormId}}
- **Weapon Type:** {{weaponType}}
- **Base Damage:** {{baseDamage}}
- **Weight:** {{weight}}
- **Value:** {{value}}
  {{#if material}}- **Material:** {{material}}{{/if}}
- **Enchanted Variants:** {{count}}

### Example Enchanted Weapons

{{#each examples}}

- {{name}} ({{baseDamage}} damage, {{weight}} weight, {{value}} value)
  {{/each}}

---

{{/each}}

## Summary

This document shows {{generalWeaponTemplates.length}} general weapon templates that can be enchanted with various enchantments. Each template represents a base weapon that players can find or craft and then enchant with different magical effects.
