# Enchanted Weapons

This document catalogs all enchanted weapons found in the mod data, organized by weapon category. Each weapon entry includes base stats, enchantment details, and effect descriptions.

## Weapon Categories

{{#each weaponCategories}}

### {{categoryName}}

{{#each weapons}}
{{> enchanted_weapon_block }}
{{/each}}

---

{{/each}}

## Summary

- **Total Enchanted Weapons:** {{totalWeapons}}
- **Categories:** {{totalCategories}}
- **Generated:** {{generatedDate}}
