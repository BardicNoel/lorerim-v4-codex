# {{name}}

{{description}}

## Effects
{{#each effects}}
{{#if condition}}
**{{type}}**: {{value}} *({{condition}})*
{{else}}
**{{type}}**: {{value}}
{{/if}}
{{#if scope}}
- Scope: {{scope}}
{{/if}}
{{#if duration}}
- Duration: {{duration}} seconds
{{/if}}
{{#if chance}}
- Chance: {{chance}}%
{{/if}}
{{/each}}

<details>
<summary>Technical Details</summary>

### Effect Relationships
{{diagram}}

### Implementation Details
{{#each effects}}
#### Effect {{@index}}
- Type: `{{type}}`
- MGEF: `{{mgefEdid}}`
{{#if scriptName}}
- Script: `{{scriptName}}`
{{/if}}
{{#if flags}}
- Flags: {{#each flags}}`{{this}}` {{/each}}
{{/if}}
{{#if primaryAV}}
- Primary Actor Value: `{{primaryAV}}`
{{/if}}
{{#if secondaryAV}}
- Secondary Actor Value: `{{secondaryAV}}`
{{/if}}
{{#if conditions}}
#### Conditions
{{#each conditions}}
- {{this}}
{{/each}}
{{/if}}

{{/each}}
</details>

{{#if category}}
*Category: {{category}}*
{{/if}}

**Categories**: {{#each tags}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}

**Spell Properties**:
- Cost: {{spell.cost}}
- Type: {{spell.type}}
- Cast Type: {{spell.castType}}
- Delivery: {{spell.delivery}}

<details>
<summary>Technical Details</summary>

- EDID: `{{edid}}`
- FormID: `{{formId}}`
</details>

--- 