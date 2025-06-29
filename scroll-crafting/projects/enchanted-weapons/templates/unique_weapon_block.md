### {{name}}

- **Type & Stats:** {{weaponType}} | Damage: {{baseDamage}} | Weight: {{weight}} | Value: {{value}}
- **Enchantment:** {{#if enchantment.chargeAmount}}Uses: {{#if enchantment.cost}}{{math enchantment.chargeAmount "/" enchantment.cost}}{{else}}N/A{{/if}} | Total Charge: {{enchantment.chargeAmount}} | Cost Per Use: {{enchantment.cost}}{{else}}No Charge{{/if}}{{#if cannotDisenchant}} | **Cannot be disenchanted**{{/if}}

{{#if description}}### Description
{{description}}{{/if}}

#### Effects

{{#each enchantment.effects}}

- **{{name}}:** {{description}}
  {{/each}}

---
