## {{material}} {{weaponType}} Pattern

- **Weapon Type:** {{weaponType}}
- **Material:** {{material}}
- **Base Damage Range:** {{baseStats.damageRange.[0]}} - {{baseStats.damageRange.[1]}}
- **Weight Range:** {{baseStats.weightRange.[0]}} - {{baseStats.weightRange.[1]}}
- **Value Range:** {{baseStats.valueRange.[0]}} - {{baseStats.valueRange.[1]}}
- **Total Variants:** {{count}}

### Enchantments

{{#each enchantments}}

- **{{name}}:** {{description}}
  {{/each}}

### Example Weapons

{{#each examples}}

- **{{name}}** ({{baseDamage}} damage, {{weight}} weight, {{value}} value)
  {{#if description}}
  - _{{description}}_
    {{/if}}
    {{/each}}

---
