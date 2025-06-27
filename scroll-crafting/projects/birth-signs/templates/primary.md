# Skyrim Birthsigns

## In-Game Selection

When you start a new character, you'll be prompted to choose your birthsign. The game will present you with the following options:

{{#if promptMessage}}
{{promptMessage}}
{{/if}}

{{#if promptNote}}
> **{{promptNote}}**
{{/if}}

---

{{#each birthsignGroups}}
## {{name}} Group

{{#each birthsigns}}
{{> birthsign_block }}
{{/each}}

{{/each}} 