### {{name}}

- Type & Stats: **{{weaponType}}** | Damage: _{{baseDamage}}_ | Weight: _{{weight}}_ | Value: _{{value}}_
- Enchantment: Uses: _{{#if enchantment.cost}}{{math enchantment.chargeAmount "/" enchantment.cost}}{{else}}N/A{{/if}}_ | Total Charge: _{{enchantment.chargeAmount}}_ | Cost Per Use: _{{enchantment.cost}}_ ({{enchantment.costMethod}} calculation){{#if cannotDisenchant}} | **Cannot be disenchanted**{{/if}}

{{#if description}}### Description
{{description}}{{/if}}

#### Effects

{{#each enchantment.effects}}

- **{{name}}:** {{replaceNumbers description}} (Magnitude: _{{magnitude}}_{{#if duration}}, Duration: _{{duration}}_{{/if}})
  {{/each}}

---
