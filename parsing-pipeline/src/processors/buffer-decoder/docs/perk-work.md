# PERK Schema Analysis and Required Fixes

## Overview

The current PERK schema implementation is incomplete and does not properly handle the complex structure of PERK records as defined in the UESP documentation. This document outlines the issues and required fixes.

## Current Issues

### 1. **Missing CTDA (Condition Data) Support**

- **Issue**: The current schema completely ignores CTDA subrecords, which are critical for PERK functionality
- **UESP Documentation**: CTDA fields appear in multiple places within PERK records and are essential for condition checking
- **Impact**: Without CTDA parsing, we lose all conditional logic that determines when perks are active

### 2. **Incorrect DATA Field Handling**

- **Issue**: The current DATA field is treated as a simple uint8 array, but it has different meanings in different contexts
- **UESP Documentation**:
  - Main DATA: `uint8[5]` - IsTrait, Level, NumRanks, IsPlayable, IsHidden
  - Quest Section DATA: `uint8[8]` - formid + stage + 3 null bytes
  - Ability Section DATA: `formid` - Spell ID
  - Complex Entry Point DATA: `uint8[3]` - EffectType + FunctionType + CondTypeCount
- **Impact**: All perk data is being parsed incorrectly

### 3. **Missing Perk Section Structure**

- **Issue**: The current schema doesn't properly handle the grouped nature of perk sections
- **UESP Documentation**: PERK records contain 1 or more perk sections, each starting with PRKE and ending with PRKF
- **Impact**: We're not capturing the hierarchical structure of perk sections

### 4. **Incomplete Entry Point Processing**

- **Issue**: EPFT, EPFD, EPF2, EPF3 fields are not properly handled based on their dynamic nature
- **UESP Documentation**: These fields have variable formats depending on EPFT value:
  - EPFT=01: EPFD is float
  - EPFT=02: EPFD is 8-byte struct (float AV, float Factor)
  - EPFT=03: EPFD is formid
  - EPFT=04: EPF2=LString "verb", EPF3=dword, EPFD=formid
  - EPFT=05: EPFD is formid (SPEL)
  - EPFT=06: EPFD is zstring (GMST editorid)
  - EPFT=07: EPFD is lstring (verb for custom activate actions)
- **Impact**: Entry point data is not being parsed correctly

### 5. **Missing Effect Type and Function Type Support**

- **Issue**: No support for the extensive effect type and function type systems
- **UESP Documentation**:
  - 54 different effect types (0x00-0x54) with varying parameter counts
  - 15 different function types (0x01-0x0F) with different data formats
- **Impact**: We can't understand what perks actually do

### 6. **No Support for Perk Section Types**

- **Issue**: The schema doesn't differentiate between the three perk section types
- **UESP Documentation**:
  - Type 0: Quest Section - sets quest stage
  - Type 1: Ability Section - applies spell
  - Type 2: Complex Entry Point Section - conditional effects with multiple parameters
- **Impact**: We can't properly categorize or process different perk types

## Required Fixes

### 1. **Implement CTDA Support**

```typescript
// Add to sharedFields in createSchema.ts
conditionBlock: [
  { name: 'op', type: 'uint8' },
  { name: 'value', type: 'float32' },
  { name: 'functionIndex', type: 'uint32' },
  // Additional CTDA fields as needed
],
```

### 2. **Create Perk Section Grouped Schema**

```typescript
// Use grouped field type to handle perk sections
perkSections: {
  type: 'grouped',
  virtualField: 'sections',
  cardinality: 'multiple',
  terminatorTag: 'PRKF',
  groupSchema: {
    PRKE: { /* section header */ },
    PRKC: { /* condition type */ },
    CTDA: { /* conditions */ },
    EPFT: { /* effect type */ },
    EPFD: { /* dynamic payload */ },
    EPF2: { /* extra data */ },
    EPF3: { /* additional data */ },
    PRKF: { /* section terminator */ }
  }
}
```

### 3. **Implement Dynamic Field Parsing**

```typescript
// Create parsers that handle variable field formats based on context
const createDynamicParser = (contextField: string) => {
  return (buffer: Buffer, offset: number, schema: FieldSchema) => {
    // Parse based on context (section type, EPFT value, etc.)
  };
};
```

### 4. **Add Effect Type and Function Type Mappings**

```typescript
// Create comprehensive mappings for all effect and function types
const EFFECT_TYPES = {
  0x00: 'Mod Attack Damage',
  0x01: 'Mod Power Attack Damage',
  // ... all 54 effect types
};

const FUNCTION_TYPES = {
  0x01: 'Set Value',
  0x02: 'Add Value',
  // ... all 15 function types
};
```

### 5. **Implement Section-Specific DATA Parsing**

```typescript
// Create different DATA parsers based on section type
const createDataParser = (sectionType: number) => {
  switch (sectionType) {
    case 0:
      return questDataParser;
    case 1:
      return abilityDataParser;
    case 2:
      return complexDataParser;
    default:
      return unknownDataParser;
  }
};
```

### 6. **Add Comprehensive Validation**

```typescript
// Validate perk structure integrity
const validatePerkStructure = (parsedPerk: any) => {
  // Check section boundaries
  // Validate condition logic
  // Verify effect type compatibility
  // Ensure proper termination
};
```

## Implementation Priority

### Phase 1: Foundation

1. Implement CTDA support in shared fields
2. Create basic perk section grouping
3. Add main DATA field parsing

### Phase 2: Section Processing

1. Implement section type detection
2. Add section-specific DATA parsing
3. Create basic entry point handling

### Phase 3: Advanced Features

1. Implement dynamic EPFT/EPFD parsing
2. Add effect type and function type mappings
3. Create comprehensive validation

### Phase 4: Optimization

1. Add performance optimizations
2. Implement caching for repeated patterns
3. Add comprehensive error handling

## Testing Requirements

### Unit Tests

- Test each section type independently
- Validate CTDA parsing
- Test dynamic field parsing
- Verify effect type mappings

### Integration Tests

- Test complete PERK record parsing
- Validate section grouping
- Test error handling for malformed records

### Validation Tests

- Compare parsed output with xEdit
- Verify effect type accuracy
- Test condition logic parsing

## Dependencies

### Required Schema Updates

- Extend `GroupedFieldsSchema` to support dynamic termination
- Add support for context-dependent field parsing
- Implement conditional field inclusion

### Required Parser Updates

- Add support for variable-length structs
- Implement context-aware parsing
- Add validation and error recovery

### Required Type Updates

- Add comprehensive PERK-specific types
- Create effect type and function type enums
- Add validation result types

## Conclusion

The current PERK schema is fundamentally incomplete and needs significant restructuring to properly handle the complex nature of PERK records. The implementation should prioritize the grouped section structure and dynamic field parsing capabilities, as these are core to understanding how perks function in Skyrim.
