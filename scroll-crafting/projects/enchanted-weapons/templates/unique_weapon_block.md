## {{name}}

- **Weapon Type:** {{weaponType}}
- **Base Damage:** {{baseDamage}}
- **Weight:** {{weight}}
- **Value:** {{value}}
- **Enchantment:** {{enchantment.name}}
- **Enchantment Cost:** {{enchantment.cost}}
- **Charge Amount:** {{enchantment.chargeAmount}}
- **Uniqueness Factors:** {{#each uniquenessFactors}}- {{this}}{{/each}}

{{#if description}}

### Description

{{description}}
{{/if}}

### Effects

{{#each enchantment.effects}}

- **{{name}}:** {{description}}
  {{/each}}

---
