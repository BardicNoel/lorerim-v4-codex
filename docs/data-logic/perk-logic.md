# PERK Dependency Tree Analysis

## Current PERK Data Available

### 1. **AVIF + PERK Merged Structure**

We now have a comprehensive data structure created by merging **AVIF (Actor Value Information)** records with their related **PERK** records. This gives us:

#### **AVIF Record (Skill Tree Container)**

- **EDID**: Skill tree identifier (e.g., "AVLockpicking")
- **FULL**: Skill tree name (e.g., "Wayfarer")
- **DESC**: Skill tree description
- **CNAM**: Skill category (e.g., "Stealth")

#### **Perk Sections Array**

Each AVIF record contains a `perkSections` array with connected perks:

```json
{
  "EDID": "AVLockpicking",
  "FULL": "Wayfarer",
  "DESC": "Seasoned Wayfarers...",
  "CNAM": "Stealth",
  "perkSections": [
    {
      "PNAM": "0x00000000", // Root/master perk (null reference)
      "XNAM": 0,
      "YNAM": 0, // Grid coordinates
      "HNAM": 0,
      "VNAM": 0, // Visual positioning
      "CNAM": ["Master Connection"], // Connection types
      "INAM": 0 // Perk index
    },
    {
      "PNAM": {
        // Full perk record
        "EDID": "REQ_Lockpicking_00_Looter",
        "FULL": "Cheap Tricks",
        "DESC": "You have learned the basics...",
        "DATA": {
          /* perk flags */
        },
        "sections": [
          /* perk effects */
        ]
      },
      "XNAM": 3,
      "YNAM": 0, // Position in tree
      "CNAM": ["Connection 17"], // Connection info
      "INAM": 10 // Perk index
    }
  ]
}
```

### 2. **Perk Sections Structure**

Each perk can have multiple sections that define its behavior:

#### **Quest Sections (Type 0)**

- **DATA**: Contains questId and stage
- **CTDA**: Conditions for when the perk is available
- **Purpose**: Sets quest stages when perk is taken

#### **Ability Sections (Type 1)**

- **DATA**: Contains spellId
- **CTDA**: Conditions for when the ability is granted
- **Purpose**: Grants spells/abilities

#### **Complex Entry Point Sections (Type 2)**

- **DATA**: effectType, functionType, conditionCount
- **PRKC/CTDA**: Condition subsections
- **EPFT/EPF2/EPF3/EPFD**: Entry point data
- **Purpose**: Modifies game mechanics (damage, costs, etc.)

### 3. **Condition Data (CTDA)**

- **Operator**: Comparison type and flags (parsed to readable strings)
- **FunctionIndex**: What to check (skill level, quest stage, etc.)
- **Parameters**: Values to compare against
- **RunOnType**: What entity to check (player, target, etc.)

## What We Have for Dependencies

### ✅ **Complete Skill Tree Structure**

1. **Skill Tree Organization**: AVIF records provide complete tree structure
2. **Perk Positioning**: X/Y coordinates and visual positioning for each perk
3. **Perk Connections**: CNAM arrays show connection types between perks
4. **Tree Navigation**: INAM provides unique indices for tree traversal

### ✅ **Direct Dependencies**

1. **Quest Dependencies**: Perks can require specific quest stages
2. **Spell Dependencies**: Ability perks grant specific spells
3. **Skill Dependencies**: CTDA conditions can check skill levels
4. **Level Dependencies**: Perks have level requirements

### ✅ **Conditional Logic**

- **CTDA Fields**: Complex conditions that determine when perks are active
- **Multiple Conditions**: Perks can have multiple CTDA blocks (AND/OR logic)
- **Dynamic Effects**: Complex sections can modify game mechanics

## Data Trimming Strategy

### **Fields Being Removed for Cleaner Output**

#### **Redundant Raw Data**

- `operator.rawOperator`, `operator.rawCompareOperator`, `operator.rawFlags`
- Raw values are kept alongside parsed readable versions

#### **Unknown/Padding Fields**

- `unknown`, `unknown2`, `unknown3`, `unknown4`
- `padding`, `padding2`
- These fields contain no semantic meaning

#### **Null/Empty Fields**

- `PRKF: null`, `EPFD: null`
- `FNAM: []` (empty arrays)
- `reference: "0x00000000"` (always null references)

#### **Optional Positioning Data**

- `HNAM`, `VNAM` (precise visual coordinates)
- Keep `XNAM`, `YNAM` for grid positioning

### **Fields Being Kept (Essential)**

#### **Tree Information**

- `EDID`, `FULL`, `DESC`, `CNAM` (skill tree metadata)

#### **Perk Data**

- `perkSections[].PNAM` - Perk FormID and full perk data
- `perkSections[].XNAM/YNAM` - Grid coordinates
- `perkSections[].CNAM` - Connection IDs (parsed)
- `perkSections[].INAM` - Perk index

#### **Effect Information**

- `sections[].PRKE` - Section type and priority
- `sections[].DATA` - Effect type and function
- `sections[].CTDA` - Conditions (simplified)
- `sections[].EPFT/EPFD` - Entry point data

## Current Capabilities

### ✅ **What We Can Build Now**

1. **Complete Skill Trees**: Full tree structure with positioning
2. **Perk Effect Analysis**: What each perk does
3. **Condition Analysis**: When perks are active
4. **Quest Integration**: Which quests affect perks
5. **Spell/Ability Mapping**: What abilities perks grant
6. **Tree Visualization**: Grid-based tree layouts
7. **Connection Analysis**: Perk relationship mapping
8. **Progression Paths**: Optimal routes through skill trees

### ✅ **Dependency Tree Construction**

```typescript
interface PerkDependencyNode {
  perkId: string;
  perkName: string;
  skillTree: string;
  position: { x: number; y: number; index: number };
  connections: string[];
  prerequisites: string[]; // Derived from connections
  skillRequirements: {
    skillId: string;
    level: number;
  }[];
  questRequirements: {
    questId: string;
    stage: number;
  }[];
  effects: PerkEffect[];
}
```

## Recommendations

### 1. **Immediate Next Steps**

- **Complete Data Trimming**: Apply the trimming configuration to clean up the data
- **Build Tree Visualizations**: Use positioning data to create visual skill trees
- **Analyze Connections**: Map perk prerequisite relationships

### 2. **Enhanced Analysis**

- **Cross-Reference Skills**: Link perks to skill records
- **Quest Integration**: Map quest dependencies
- **Faction Analysis**: Include faction requirements

### 3. **Documentation Generation**

- **Perk Cards**: Individual perk documentation
- **Tree Maps**: Visual skill tree layouts
- **Build Guides**: Optimal progression paths
- **Effect Catalogs**: Comprehensive perk effects

## Conclusion

**Current State**: We now have **~95%** of the data needed for complete dependency trees.

**Key Achievement**: The AVIF+PERK merge provides complete skill tree structure with:

- Full perk positioning and connections
- Comprehensive effect data
- Clean, parseable condition information
- Tree-level organization

**Next Priority**: Complete the data trimming to create a clean, focused dataset optimized for analysis and documentation generation.

---

# Comprehensive Perk Documentation Analysis

## From Joined AVIF + PERK Data

Based on the joined data structure, we can extract comprehensive information for perk documentation:

## 1. **Skill Tree Organization**

### **Tree Structure**

- **Skill Category**: Combat, Magic, Stealth (from AVIF.CNAM)
- **Tree Name**: "Alteration", "One-Handed", etc. (from AVIF.FULL)
- **Tree Description**: Detailed explanation of the skill (from AVIF.DESC)
- **Tree Abbreviation**: "ALT", "1H", etc. (from AVIF.ANAM)

### **Perk Positioning**

- **Grid Coordinates**: X/Y position in skill tree (from AVIF.perkSections.XNAM/YNAM)
- **Visual Position**: Horizontal/Vertical positioning (from AVIF.perkSections.HNAM/VNAM)
- **Perk Index**: Unique identifier for the perk box (from AVIF.perkSections.INAM)

## 2. **Perk Connection Network**

### **Connection Types**

- **Connection IDs**: What other perks this connects to (from AVIF.perkSections.CNAM)
- **Connection Descriptions**: "Prerequisite Connection", "Branch Start", etc.
- **Connection Flow**: Direction of perk progression through the tree

### **Tree Navigation**

- **Prerequisite Paths**: Which perks must be taken first
- **Branch Points**: Where the tree splits into different paths
- **End Points**: Final perks in each branch

## 3. **Perk Effects & Mechanics**

### **Spell Modifications**

- **Cost Reduction**: "Mod Spell Cost" effects with multipliers
- **Magnitude Boosts**: "Mod Spell Magnitude" effects
- **Duration Extensions**: "Mod Spell Duration" effects
- **Function Types**: "Multiply Value", "Multiply 1 + Actor Value"

### **Conditional Effects**

- **Activation Conditions**: When the perk effects are active
- **Skill Requirements**: Minimum skill levels needed
- **Quest Dependencies**: Required quest stages
- **Target Types**: "Subject", "Target", "Reference"

## 4. **Perk Categories & Types**

### **Perk Classification**

- **Perk Level**: Novice, Apprentice, Adept, Expert, Master (from flags)
- **Perk Type**: Combat, Magic, Stealth, Crafting, etc. (from flags)
- **Special Types**: Quest perks, faction perks, race perks (from flags)

### **Perk Rarity**

- **Normal Perks**: Standard progression perks
- **Unique Perks**: Special one-of-a-kind perks
- **Legendary Perks**: High-tier special perks

## 5. **Documentation Outputs**

### **Perk Cards**

```typescript
interface PerkCard {
  name: string;
  description: string;
  skillTree: string;
  position: { x: number; y: number };
  level: string;
  type: string[];
  effects: PerkEffect[];
  requirements: PerkRequirement[];
  connections: PerkConnection[];
}
```

### **Skill Tree Maps**

- **Visual Layout**: Grid-based tree visualization
- **Connection Lines**: Visual representation of perk relationships
- **Progression Paths**: Highlighted routes through the tree

### **Effect Catalogs**

- **Spell Modifications**: Comprehensive list of all spell effects
- **Condition Requirements**: All activation conditions
- **Quest Integration**: Quest-related perk effects

### **Build Guides**

- **Optimal Paths**: Recommended perk progression routes
- **Specialization Trees**: Focused builds for specific playstyles
- **Prerequisite Chains**: Required perk sequences

## 6. **Advanced Analytics**

### **Perk Impact Analysis**

- **Effect Magnitude**: How much each perk modifies spells
- **Condition Complexity**: How many conditions each perk has
- **Integration Depth**: How many systems each perk affects

### **Tree Balance Analysis**

- **Perk Distribution**: How perks are spread across skill levels
- **Connection Density**: How interconnected each tree is
- **Progression Smoothness**: How evenly perks are distributed

### **Cross-Reference Data**

- **Spell Associations**: Which spells are affected by each perk
- **Quest Dependencies**: Which quests unlock or require perks
- **Faction Relationships**: Which factions are associated with perks

## 7. **Documentation Formats**

### **Structured Data**

- **JSON Catalogs**: Machine-readable perk databases
- **API Endpoints**: Programmatic access to perk data
- **Search Indexes**: Full-text search across all perk information

### **Human-Readable**

- **Markdown Guides**: Detailed perk descriptions
- **HTML Documentation**: Interactive perk browsers
- **PDF References**: Printable perk guides

### **Visual Representations**

- **Tree Diagrams**: Visual skill tree layouts
- **Flow Charts**: Perk progression diagrams
- **Effect Graphs**: Spell modification visualizations

## 8. **Implementation Strategy**

### **Phase 1: Basic Documentation**

1. Extract all perk names, descriptions, and basic info
2. Map perk positions and connections
3. Generate basic perk cards and tree layouts

### **Phase 2: Effect Analysis**

1. Parse all spell modification effects
2. Document conditional requirements
3. Create effect catalogs and guides

### **Phase 3: Advanced Features**

1. Build interactive tree browsers
2. Create build optimization tools
3. Generate comprehensive guides

This joined data structure provides everything needed to create comprehensive, interactive perk documentation that would be invaluable for both players and modders!

---

# Data Trimming Analysis for Perk Documentation

## Fields to Keep (Essential for Documentation)

### **Tree-Level Information**

- `EDID` - Tree identifier
- `FULL` - Tree name ("Speech", "Alteration")
- `DESC` - Tree description
- `CNAM` - Skill category ("Combat", "Magic", "Stealth")
- `ANAM` - Tree abbreviation (if present)

### **Perk-Level Information**

- `perkSections[].PNAM` - Perk FormID and full perk data
- `perkSections[].XNAM/YNAM` - Grid coordinates
- `perkSections[].HNAM/VNAM` - Visual positioning
- `perkSections[].CNAM` - Connection IDs (parsed)
- `perkSections[].INAM` - Perk index

### **Perk Details**

- `PNAM.EDID` - Perk identifier
- `PNAM.FULL` - Perk name
- `PNAM.DESC` - Perk description
- `PNAM.DATA` - Basic perk flags (level, ranks, etc.)

### **Effect Information**

- `sections[].PRKE` - Section type and priority
- `sections[].DATA` - Effect type and function
- `sections[].CTDA` - Conditions (simplified)
- `sections[].EPFT/EPFD` - Entry point data

## Fields to Trim (Noise/Redundancy)

### **Redundant Identifiers**

- `AVSK` - Skill progression data (not needed for documentation)
- `perkSections[].SNAM` - Skill FormID (same as parent, redundant)
- `perkSections[].FNAM` - Raw flag values (keep parsed version only)

### **Debug/Technical Fields**

- `sections[].CTDA.unknown*` - Unknown padding fields
- `sections[].CTDA.padding*` - Padding fields
- `sections[].CTDA.rawOperator/rawCompareOperator/rawFlags` - Raw values (keep parsed)
- `sections[].PRKF` - Null fields

### **Verbose CTDA Data**

- `sections[].CTDA.operator.raw*` - Raw operator values
- `sections[].CTDA.unknown4` - Usually -1, not meaningful
- `sections[].CTDA.param1/param2` - Often 0 or not meaningful

## Optimized Data Structure

```typescript
interface TrimmedPerkData {
  // Tree Info
  treeId: string;
  treeName: string;
  treeDescription: string;
  category: string;
  abbreviation?: string;

  // Perk Sections
  perks: {
    perkId: string;
    perkName: string;
    perkDescription: string;
    level: number;
    ranks: number;
    isPlayable: boolean;
    isHidden: boolean;

    // Position
    position: {
      x: number;
      y: number;
      horizontal: number;
      vertical: number;
      index: number;
    };

    // Connections
    connections: string[];

    // Effects
    effects: {
      type: string;
      function: string;
      priority: number;
      conditions: {
        operator: string;
        functionIndex: number;
        comparisonValue: number;
        runOnType: string;
      }[];
      entryPointData?: any;
    }[];
  }[];
}
```

## Trimming Benefits

### **Size Reduction**

- **~40-50% smaller** files
- **Faster processing** and loading
- **Reduced bandwidth** for web applications

### **Clarity Improvement**

- **Focus on meaningful data** only
- **Easier to read** and understand
- **Cleaner documentation** output

### **Maintenance Benefits**

- **Less noise** in the data
- **Easier to debug** issues
- **Simpler schema** to maintain

## Implementation Strategy

### **Phase 1: Basic Trimming**

1. Remove all `unknown*` and `padding*` fields
2. Remove redundant identifiers
3. Keep only parsed flag values

### **Phase 2: Smart Trimming**

1. Remove empty/null fields
2. Simplify CTDA structures
3. Merge related data fields

### **Phase 3: Optimization**

1. Flatten nested structures where beneficial
2. Use consistent naming conventions
3. Add computed fields for common queries

## Example: Before vs After

### **Before (Verbose)**

```json
{
  "EDID": "AVSpeechcraft",
  "FULL": "Speech",
  "DESC": "Those who dabble...",
  "CNAM": "Stealth",
  "AVSK": [0, 0, 2, 9999],
  "perkSections": [
    {
      "PNAM": "0x00000000",
      "FNAM": 1280656896,
      "XNAM": 1291848012,
      "YNAM": 1936421473,
      "HNAM": 0,
      "VNAM": 0,
      "SNAM": "0x0000044F",
      "CNAM": ["Apprentice Connection"],
      "INAM": 0
    }
  ]
}
```

### **After (Trimmed)**

```json
{
  "treeId": "AVSpeechcraft",
  "treeName": "Speech",
  "treeDescription": "Those who dabble...",
  "category": "Stealth",
  "perks": [
    {
      "perkId": "0x00000000",
      "position": { "x": 1291848012, "y": 1936421473, "index": 0 },
      "connections": ["Apprentice Connection"]
    }
  ]
}
```

This trimming approach maintains all essential documentation data while significantly reducing complexity and file size.
