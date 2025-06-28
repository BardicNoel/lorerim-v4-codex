# Bound Weapon Manifestations

Bound and Mystic weapons are magical manifestations rather than physical weapons. They have no weight or value, but provide powerful magical capabilities.

## Bound Weapons

{{#each boundMysticWeapons}}
{{#if isBound}}
{{> bound_mystic_weapon_block }}
{{/if}}
{{/each}}

## Mystic Weapons

{{#each boundMysticWeapons}}
{{#unless isBound}}
{{> bound_mystic_weapon_block }}
{{/unless}}
{{/each}}

## Summary

- **Total Bound/Mystic Weapons:** {{boundMysticWeapons.length}}
- **Bound Weapons:** {{boundCount}}
- **Mystic Weapons:** {{mysticCount}}
- **Generated:** {{generatedDate}}
