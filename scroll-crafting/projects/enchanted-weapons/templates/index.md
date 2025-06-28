# Enchanted Weapons

A comprehensive guide to enchanted weapons found in Skyrim, organized by uniqueness and enchantment type.

**Generated:** {{generatedDate}}  
**Total Weapons:** {{totalWeapons}}

## Overview

This document categorizes enchanted weapons into several types:

- **Unique Weapons** ({{uniqueWeapons.length}}) - One-of-a-kind weapons with special properties
- **General Weapon Templates** ({{generalWeaponTemplates.length}}) - Base weapons that can be enchanted
- **Base Weapon Templates** ({{baseWeaponTemplates.length}}) - Unenchanted base weapons
- **General Weapon Enchantments** ({{generalWeaponEnchantments.length}}) - Common enchantments for general weapons
- **Bound & Mystic Weapons** ({{boundMysticWeapons.length}}) - Magically summoned weapons
- **Wands & Staves** ({{wandStaffWeapons.length}}) - Magical implements

## Quick Navigation

- [Unique Weapons](#unique-weapons) - Special one-of-a-kind weapons
- [General Weapon Templates](#general-weapon-templates) - Base weapon types
- [Base Weapon Templates](#base-weapon-templates) - Unenchanted base weapons
- [General Weapon Enchantments](#general-weapon-enchants) - Common enchantments
- [Bound & Mystic Weapons](#bound--mystic-weapons) - Magically summoned weapons
- [Wands & Staves](#wands--staves) - Magical implements

## Unique Weapons

{{#each uniqueWeapons}}
{{> unique_weapon_block }}
{{/each}}

## General Weapon Templates

{{#each generalWeaponTemplates}}
{{> general_weapon_template_block }}
{{/each}}

## Base Weapon Templates

{{#each baseWeaponTemplates}}
{{> base_weapon_template_block }}
{{/each}}

## General Weapon Enchantments

{{#each generalWeaponEnchantments}}
{{> general_weapon_enchantment_block }}
{{/each}}

## Bound & Mystic Weapons

{{#each boundMysticWeapons}}
{{> bound_mystic_weapon_block }}
{{/each}}

## Wands & Staves

{{#each wandStaffWeapons}}
{{> wand_staff_block }}
{{/each}}

## Summary

- **Total Enchanted Weapons:** {{totalWeapons}}
- **Unique Weapons:** {{uniqueWeapons.length}}
- **General Weapon Templates:** {{generalWeaponTemplates.length}}
- **Base Weapon Templates:** {{baseWeaponTemplates.length}}
- **General Weapon Enchantments:** {{generalWeaponEnchantments.length}}
- **Bound & Mystic Weapons:** {{boundMysticWeapons.length}}
- **Wands & Staves:** {{wandStaffWeapons.length}}
- **Generated:** {{generatedDate}}

## Data Files

- [All Weapons JSON](enchanted-weapons.json) - Complete dataset
- [Unique Weapons JSON](unique-weapons.json) - Unique weapons only
- [Weapon Patterns JSON](weapon-patterns.json) - Pattern analysis data
- [Bound/Mystic Weapons JSON](bound-mystic-weapons.json) - Bound and mystic weapons
- [Wands and Staves JSON](wands-staves.json) - Wands and staves data
