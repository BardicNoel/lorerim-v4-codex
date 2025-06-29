### {{name}}

- Type & Stats: **{{weaponType}}** | Damage: _{{baseDamage}}_ | Weight: _{{weight}}_ | Value: _{{value}}_
- Charges: {{#if enchantment.cost}}Uses: _{{#with enchantment}}{{math chargeAmount "/" cost}}{{/with}}_ | Total Charge: _{{enchantment.chargeAmount}}_ | Cost Per Use: _{{enchantment.cost}}_ ({{enchantment.costMethod}} calculation){{else}}**_Infinite_**{{/if}}{{#if cannotDisenchant}} | **Cannot be disenchanted**{{/if}}

{{#if description}}### Description
{{description}}{{/if}}

#### Effects

{{#each enchantment.effects}}

- **{{name}}:** {{replaceNumbers description}} (Magnitude: _{{magnitude}}_{{#if duration}}, Duration: _{{duration}}_{{/if}})
  {{/each}}

---
