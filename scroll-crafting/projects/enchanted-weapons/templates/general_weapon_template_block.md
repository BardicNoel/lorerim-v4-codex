## {{templateName}}

- **Base Stats:** {{weaponType}} | Damage: {{baseDamage}} | Weight: {{weight}} | Value: {{value}}{{#if material}} | Material: {{material}}{{/if}}
- **Template Info:** FormID: {{cnamFormId}} | Variants: {{count}}

### Example Variants

{{#each examples}}

- {{name}} (Damage: {{baseDamage}}, Weight: {{weight}}, Value: {{value}})
  {{/each}}

---
