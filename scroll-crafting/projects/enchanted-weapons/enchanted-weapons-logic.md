# Enchanted Weapons Domain Logic

This document explains the data relationships and processing logic for the enchanted weapons generator.

## Data Flow

```
WEAP Records → Filter (has EITM, not REQ_NULL_) → Resolve ENCH → Resolve MGEF → Transform → Output
```

## Record Relationships

### Primary Chain

1. **WEAP.EITM** → **ENCH** (weapon enchantment reference)
2. **ENCH.EFID** → **MGEF** (enchantment effect reference)

### Data Extraction Points

- **WEAP.FULL** → weapon display name
- **WEAP.DATA** → base stats (damage, weight, value)
- **WEAP.DNAM.animationType** → weapon category
- **ENCH.FULL** → enchantment display name
- **ENCH.ENIT** → enchantment cost and charge data
- **ENCH.EFIT** → effect magnitude, duration, area
- **MGEF.FULL** → effect display name
- **MGEF.DESC** → effect description

## Processing Logic

### 1. Filter Enchanted Weapons

- Find all WEAP records with non-empty EITM field
- **Exclude weapons with EDIDs starting with "REQ*NULL*"** (these have special handling to remove them from the game)
- Skip weapons without enchantments
- Log warnings for malformed EITM references

### 2. Resolve Enchantments

- Use `findByFormId()` to link WEAP.EITM to ENCH records
- Validate ENCH record structure
- Handle missing enchantment records gracefully

### 3. Resolve Magic Effects

- Use `findByFormId()` to link ENCH.EFID to MGEF records
- Extract effect details from MGEF.DATA
- Handle missing magic effect records gracefully

### 4. Transform Data

- Map weapon stats to semantic fields
- Calculate enchantment costs from ENIT data
- Format effect descriptions for readability
- Categorize weapons by animation type

### 5. Group and Sort

- Group weapons by category using `groupWeaponsByCategory()`
- Sort weapons alphabetically within categories
- Sort categories alphabetically

## Weapon Categories

The system maps WEAP.DNAM.animationType to these categories:

| Animation Type | Category           |
| -------------- | ------------------ |
| 1              | One-Handed Swords  |
| 2              | One-Handed Daggers |
| 3              | One-Handed Axes    |
| 4              | One-Handed Maces   |
| 5              | Two-Handed Swords  |
| 6              | Two-Handed Axes    |
| 7              | Bows               |
| 8              | Staves             |
| 9              | Crossbows          |

## Error Handling Strategy

### Missing References

- Log warnings for unresolved EITM references
- Log warnings for unresolved EFID references
- Skip weapons with missing dependencies
- Continue processing other weapons

### Data Validation

- Validate required fields before processing
- Use fallback values for missing optional fields
- Ensure numeric fields are properly typed
- Handle malformed record structures

### Performance Considerations

- Use efficient data structures for lookups
- Process records in memory-efficient batches
- Cache resolved references to avoid repeated lookups
- Log processing statistics for monitoring

## Output Structure

### EnchantedWeapon Interface

```typescript
interface EnchantedWeapon {
  name: string; // WEAP.FULL
  weaponType: string; // Categorized from DNAM.animationType
  baseDamage: number; // WEAP.DATA.damage
  weight: number; // WEAP.DATA.weight
  value: number; // WEAP.DATA.value
  enchantment: {
    name: string; // ENCH.FULL
    cost: number; // ENCH.ENIT.enchantmentCost
    chargeAmount: number; // ENCH.ENIT.chargeAmount
    effects: EnchantedWeaponEffect[];
  };
  globalFormId: string; // WEAP.meta.globalFormId
  plugin: string; // WEAP.meta.plugin
}
```

### EnchantedWeaponEffect Interface

```typescript
interface EnchantedWeaponEffect {
  name: string; // MGEF.FULL
  magnitude: number; // ENCH.EFIT.magnitude
  duration: number; // ENCH.EFIT.duration
  area: number; // ENCH.EFIT.area
  description: string; // MGEF.DESC
}
```

## Testing Strategy

### Unit Tests

- Test weapon-enchantment-effect resolution
- Test weapon categorization logic
- Test grouping and sorting functions
- Test error handling scenarios

### Integration Tests

- Test with real record data
- Test cross-record resolution
- Test template rendering
- Test output file generation

### Edge Cases

- Weapons without enchantments
- Missing enchantment records
- Missing magic effect records
- Malformed record structures
- Unknown weapon categories
