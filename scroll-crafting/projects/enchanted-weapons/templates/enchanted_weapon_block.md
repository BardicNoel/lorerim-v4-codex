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
  - Magnitude: {{magnitude}}
  - Duration: {{duration}}
  - Area: {{area}}
    {{/each}}

---
