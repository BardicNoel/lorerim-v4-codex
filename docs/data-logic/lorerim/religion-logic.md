# Wintersun Religion System Analysis

## Current Religion Data Available

### 1. **QUST-Driven Religion System**

Wintersun uses a quest-based system where religion data is stored in quest properties. The main quest `WSN_TrackerQuest_Quest` contains all deity information through VMAD (Virtual Machine Adapter) script properties.

#### **Quest Structure**

- **Quest ID**: `WSN_TrackerQuest_Quest` (FormID: 0x04005901)
- **Plugin**: Wintersun.esp
- **Script**: Contains 164 properties defining all deity data

#### **Property Categories**

Each deity has multiple properties that define their characteristics:

```json
{
  "propertyName": "WSN_DeityName",
  "propertyType": 12, // Array of strings
  "propertyValue": [
    "Julianos",
    "Syrabane",
    "Magnus",
    "Jephre",
    "Mara",
    "Meridia",
    "Azura",
    "Talos",
    "Akatosh",
    "Dibella"
    // ... 50+ deities total
  ]
}
```

### 2. **Deity Property Structure**

#### **Core Deity Information**

- **WSN_DeityName**: Array of all deity names (50+ deities)
- **WSN_DeityDescription**: Detailed descriptions for each deity
- **WSN_DeityIcon**: Icon identifiers for UI display
- **WSN_DeityEffect**: Primary effect FormIDs (links to SPEL records)
- **WSN_DeityEffectDescription**: Descriptions of deity effects
- **WSN_DeityEffectIcon**: Effect icon identifiers

#### **Religious Mechanics**

- **WSN_Blessing**: Blessing effect FormIDs (links to SPEL records)
- **WSN_Boon1**: First boon effect FormIDs (links to SPEL records)
- **WSN_Boon2**: Second boon effect FormIDs (links to SPEL records)
- **WSN_Tenet**: Religious tenet descriptions
- **WSN_DivineType**: Classification of deity type
- **WSN_FavoredRace0**: Primary favored race
- **WSN_FavoredRace1**: Secondary favored race

## What We Have for Religion Analysis

### ✅ **Complete Deity Database**

1. **Deity Names**: Complete list of all worshipable deities
2. **Deity Descriptions**: Detailed lore and background for each deity
3. **Effect References**: FormID links to SPEL records for effects
4. **Icon References**: UI display information

### ✅ **Religious Mechanics Structure**

1. **Blessing System**: Base benefits from worship
2. **Boon System**: Advanced benefits (two tiers)
3. **Tenet System**: Religious rules and requirements
4. **Race Preferences**: Which races favor which deities

### ✅ **Cross-Reference Capabilities**

- **SPEL Integration**: Effect FormIDs link to spell records
- **MGEF Integration**: Effect descriptions link to magic effect records
- **Quest Integration**: Religious progression through quest stages

## Planned Data Integration

### **SPEL Record Analysis**

#### **Effect Structure**

- **DNAM**: Effect descriptions and mechanics
- **Effects**: Array of magic effects applied
- **Conditions**: When effects are active
- **Costs**: Magicka/stamina costs for effects

#### **Blessing Effects**

- **Base Blessings**: Standard worship benefits
- **Conditional Blessings**: Benefits based on favor level
- **Racial Blessings**: Special benefits for favored races

#### **Boon Effects**

- **Boon1**: First-tier advanced benefits
- **Boon2**: Second-tier advanced benefits
- **Progression**: How boons unlock with favor

### **MGEF Record Analysis**

#### **Magic Effect Details**

- **DNAM**: Detailed effect descriptions
- **Effect Archetype**: Type of effect (buff, debuff, etc.)
- **Magnitude**: Strength of the effect
- **Duration**: How long effects last
- **Conditions**: Activation requirements

#### **Effect Categories**

- **Combat Effects**: Damage bonuses, resistances
- **Utility Effects**: Movement speed, carry weight
- **Social Effects**: Speech bonuses, persuasion
- **Crafting Effects**: Smithing, enchanting bonuses

## Religion Documentation Strategy

### **Phase 1: Deity Database**

1. **Extract All Deities**: Complete list from quest properties
2. **Map Deity Properties**: Link names to descriptions, icons, effects
3. **Create Deity Cards**: Individual deity documentation
4. **Build Deity Index**: Searchable deity database

### **Phase 2: Effect Analysis**

1. **Resolve SPEL References**: Follow FormID links to spell records
2. **Extract Effect Details**: Parse DNAM descriptions and mechanics
3. **Map Effect Categories**: Classify effects by type and purpose
4. **Create Effect Catalogs**: Comprehensive effect documentation

### **Phase 3: Religious Mechanics**

1. **Blessing Analysis**: Document all blessing effects
2. **Boon Progression**: Map boon unlocking requirements
3. **Tenet Documentation**: Religious rules and requirements
4. **Race Integration**: Favored race benefits

### **Phase 4: Advanced Features**

1. **Build Optimization**: Optimal deity choices for different builds
2. **Progression Guides**: Religious advancement paths
3. **Effect Comparison**: Compare benefits across deities
4. **Integration Analysis**: How religions work with other systems

## Data Structure for Religion Documentation

### **Deity Record Structure**

```typescript
interface DeityRecord {
  // Basic Information
  deityId: string;
  deityName: string;
  deityDescription: string;
  deityIcon: string;

  // Religious Classification
  divineType: string;
  favoredRaces: string[];

  // Effects
  blessing: {
    spellId: string;
    description: string;
    effects: MagicEffect[];
  };

  boon1: {
    spellId: string;
    description: string;
    effects: MagicEffect[];
    unlockRequirement: string;
  };

  boon2: {
    spellId: string;
    description: string;
    effects: MagicEffect[];
    unlockRequirement: string;
  };

  // Religious Rules
  tenets: string[];

  // Integration
  questDependencies: string[];
  skillRequirements: string[];
}
```

### **Effect Analysis Structure**

```typescript
interface ReligionEffect {
  effectId: string;
  effectName: string;
  effectDescription: string;
  effectType: string;
  magnitude: number;
  duration: number;
  conditions: Condition[];
  costs: {
    magicka?: number;
    stamina?: number;
    favor?: number;
  };
}
```

## Current Capabilities

### ✅ **What We Can Build Now**

1. **Complete Deity Database**: All 50+ deities with basic information
2. **Effect Reference Mapping**: FormID links to SPEL/MGEF records
3. **Religious Structure**: Blessing, boon, and tenet organization
4. **Race Integration**: Favored race relationships
5. **Icon System**: UI display information

### ✅ **What We Can Build After SPEL/MGEF Analysis**

1. **Detailed Effect Documentation**: Complete effect descriptions and mechanics
2. **Build Optimization Tools**: Best deity choices for different playstyles
3. **Progression Guides**: Religious advancement paths
4. **Effect Comparison Tools**: Compare benefits across deities
5. **Integration Analysis**: How religions work with skills, quests, and factions

## Recommendations

### 1. **Immediate Next Steps**

- **Complete Property Extraction**: Extract all remaining deity properties
- **SPEL Record Resolution**: Follow FormID links to spell records
- **MGEF Record Analysis**: Parse magic effect details
- **Effect Documentation**: Create comprehensive effect catalogs

### 2. **Enhanced Analysis**

- **Quest Integration**: Map religious progression through quests
- **Skill Integration**: Link religious effects to skill systems
- **Faction Analysis**: Include faction relationships with deities

### 3. **Documentation Generation**

- **Deity Cards**: Individual deity documentation
- **Effect Catalogs**: Comprehensive effect documentation
- **Build Guides**: Optimal religious choices for different builds
- **Progression Maps**: Religious advancement visualization

## Conclusion

**Current State**: We have **~60%** of the data needed for complete religion documentation.

**Key Achievement**: The QUST property extraction provides complete deity database with:

- Full deity names and descriptions
- Effect reference mapping
- Religious mechanics structure
- Cross-reference capabilities

**Next Priority**: Complete SPEL and MGEF analysis to unlock detailed effect documentation and build optimization tools.

---

# Religion Data Trimming Strategy

## Fields to Keep (Essential for Documentation)

### **Deity Information**

- `propertyName` - Property identifier
- `propertyValue` - Actual deity data
- `propertyType` - Data type (for validation)

### **Effect References**

- All WSN\_\* effect FormIDs (links to SPEL records)
- Effect descriptions and icons
- Blessing and boon references

### **Religious Mechanics**

- Tenet descriptions
- Divine type classifications
- Favored race information

## Fields to Trim (Noise/Redundancy)

### **Technical Fields**

- `propertyStatus` - Internal VMAD status (not needed for documentation)
- `propertyType` - Can be inferred from data structure
- Raw FormID values (keep parsed versions)

### **Empty/Null Values**

- Properties with empty arrays
- Null effect references
- Missing deity data

## Optimized Religion Data Structure

```typescript
interface TrimmedReligionData {
  deities: {
    name: string;
    description: string;
    icon: string;
    divineType: string;
    favoredRaces: string[];
    blessing: {
      spellId: string;
      description: string;
    };
    boon1: {
      spellId: string;
      description: string;
      requirement: string;
    };
    boon2: {
      spellId: string;
      description: string;
      requirement: string;
    };
    tenets: string[];
  }[];
}
```

This structure maintains all essential religious data while providing a clean foundation for comprehensive documentation and analysis tools.
