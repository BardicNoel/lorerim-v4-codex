# Wands and Staves

This document contains enchanted wands and staves - magical implements that serve as both weapons and spellcasting tools.

{{#each wandStaffWeapons}}

## {{name}}

- **Weapon Type:** {{weaponType}}
- **Base Damage:** {{baseDamage}}
- **Weight:** {{weight}}
- **Value:** {{value}}
- **Enchantment:** {{enchantment.name}}
- **Enchantment Cost:** {{enchantment.cost}}
- **Charge Amount:** {{enchantment.chargeAmount}}

### Effects

{{#each enchantment.effects}}

- **{{name}}:** {{description}}

---

{{/each}}

## Summary

- **Total Wands and Staves:** {{wandStaffWeapons.length}}
- **Generated:** {{generatedDate}}
