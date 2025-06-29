## {{enchantmentName}}

- **Enchantment Stats:** Cost: {{enchantmentCost}} | Charges: {{chargeAmount}} | Uses: {{#if enchantmentCost}}{{math chargeAmount "/" enchantmentCost}}{{else}}N/A{{/if}} | Variants: {{count}}{{#if cannotDisenchant}} | **Cannot be disenchanted**{{/if}}

### Effects

{{#each effects}}

- **{{name}}:** {{description}} (Magnitude: {{magnitude}}{{#if duration}}, Duration: {{duration}}{{/if}}{{#if area}}, Area: {{area}}{{/if}})
  {{/each}}

### Example Weapons

{{#each examples}}

- {{name}} (Damage: {{baseDamage}}, Weight: {{weight}}, Value: {{value}})
  {{/each}}

---
