# General Weapon Templates

Enchanted weapons in the game world commonly follow a pattern of `<Material> <Weapon Type> of <Enchantment>`. For example, you might find an "Orcish Sword of Burning" or "Glass Bow of Frost". These weapons combine the base statistics of their material and weapon type with various magical effects.

## Available Materials

{{#each materials}}

- {{this}}
  {{/each}}

## Weapon Types

{{#each weaponTypes}}

- {{this}}
  {{/each}}

## Common Enchantments

Below is a comprehensive list of enchantments that can be found on general weapons. Any of these enchantments may appear on weapons of various materials and types.

{{#each enchantments}}

### {{name}}

- **Cost:** {{cost}} | **Charges:** {{chargeAmount}} | **Uses:** {{#if cost}}{{math chargeAmount "/" cost}}{{else}}N/A{{/if}}
- **Effects:** {{description}}
  {{/each}}

---

_Note: Not all material and weapon type combinations exist for every enchantment. Some combinations may be restricted by game balance or design._
