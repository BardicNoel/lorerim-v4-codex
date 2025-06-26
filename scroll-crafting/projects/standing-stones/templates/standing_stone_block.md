### {{name}}

**EDID:** `{{edid}}`  
**FormID:** `{{formid}}`

{{description}}

{{#if location}}
**Location:** {{location}}
{{/if}}

{{#if effects}}
**Effects:**
{{#each effects}}
- {{this}}
{{/each}}
{{/if}} 