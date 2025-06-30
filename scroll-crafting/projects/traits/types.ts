import { SpelRecordFromSchema } from "../../types/spelSchema.js";
import { MgefRecordFromSchema } from "../../types/mgefSchema.js";
import { PerkRecordFromSchema } from "../../types/perkSchema.js";

/**
 * Effect type definitions
 */
export enum EffectType {
  // Spell and Magic
  SPELL_POWER = 'spell_power',
  SPELL_COST = 'spell_cost',
  SPELL_DURATION = 'spell_duration',
  MAGIC_REGEN = 'magicka_regen',
  
  // Combat
  DAMAGE_DEALT = 'damage_dealt',
  DAMAGE_TAKEN = 'damage_taken',
  PHYSICAL_DAMAGE = 'physical_damage',
  STAGGER_CHANCE = 'stagger_chance',
  
  // Resources
  HEALTH_REGEN = 'health_regen',
  STAMINA_REGEN = 'stamina_regen',
  
  // Movement
  MOVE_SPEED = 'move_speed',
  CARRY_WEIGHT = 'carry_weight',
  
  // Social
  FOLLOWER_COST = 'follower_cost',
  MERCHANT_PRICES = 'merchant_prices',
  
  // Crafting
  CRAFTING_SPEED = 'crafting_speed',
  CRAFTING_QUALITY = 'crafting_quality',
  
  // Special
  SPECIAL = 'special_effect'
}

/**
 * Trait categories for organization
 */
export enum TraitCategory {
  COMBAT = 'combat',
  MAGIC = 'magic',
  SOCIAL = 'social',
  CRAFTING = 'crafting',
  MOVEMENT = 'movement',
  SPECIAL = 'special'
}

/**
 * Effect scope definitions
 */
export interface EffectScope {
  school?: string;      // e.g., "destruction", "restoration"
  element?: string;     // e.g., "fire", "frost", "sonic"
  substance?: string[]; // e.g., ["skooma", "alcohol"]
  weapon?: string;      // e.g., "one-handed", "bow"
  skill?: string;       // e.g., "alchemy", "smithing"
}

/**
 * Base effect interface
 */
export interface TraitEffect {
  type: EffectType;
  value: number;
  duration?: number;
  magnitude?: number;
  condition?: string;
  description?: string;
}

/**
 * Enhanced effect with additional metadata
 */
export interface StructuredEffect extends TraitEffect {
  school?: string;
  actorValue?: string;
  secondaryActorValue?: string;
  relatedPerks?: string[];
  flags: string[];
  scope?: {
    school?: string;
    element?: string;
    substance?: string[];
    weapon?: string;
    skill?: string;
  };
  area?: number;
  mgefEdid?: string;
}

/**
 * Base trait definition
 */
export interface TraitDefinition {
  name: string;
  description: string;
  edid: string;
  formId: string;
}

/**
 * Enhanced trait with resolved relationships and metadata
 */
export interface EnhancedTrait {
  name: string;
  description: string;
  edid: string;
  formId: string;
  effects: StructuredEffect[];
  category: TraitCategory;
  tags: TraitCategory[];
  diagram?: string;
  spell?: {
    cost: number;
    type: string;
    castType: string;
    delivery: string;
  };
  anchorRecord?: SpelRecordFromSchema;
}

/**
 * Record set containing all data needed for trait resolution
 */
export interface TraitRecordSet {
  spells: SpelRecordFromSchema[];
  effects: MgefRecordFromSchema[];
  perks: PerkRecordFromSchema[];
  getMgef: (formId: string) => MgefRecordFromSchema;
}

/**
 * Trait effect value types
 */
export enum ValueType {
  PERCENTAGE = 'percentage',
  FLAT = 'flat',
  MULTIPLIER = 'multiplier',
  BOOLEAN = 'boolean',
  SPECIAL = 'special'
}

/**
 * Condition trigger types
 */
export enum ConditionType {
  STATE = 'state',           // e.g., crouching, arms raised
  EQUIPMENT = 'equipment',   // e.g., wearing specific gear
  RESOURCE = 'resource',     // e.g., health threshold
  ENVIRONMENT = 'environment', // e.g., weather, location
  TARGET = 'target',         // e.g., specific enemy types
  TEMPORAL = 'temporal'      // e.g., time-based conditions
}

/**
 * Resource types that can be affected
 */
export enum ResourceType {
  HEALTH = 'health',
  MAGICKA = 'magicka',
  STAMINA = 'stamina',
  DRAGON_SOULS = 'dragon_souls',
  GOLD = 'gold'
}

/**
 * Magic schools
 */
export enum MagicSchool {
  ALTERATION = 'alteration',
  CONJURATION = 'conjuration',
  DESTRUCTION = 'destruction',
  ILLUSION = 'illusion',
  RESTORATION = 'restoration'
}

/**
 * Elements for magic effects
 */
export enum Element {
  FIRE = 'fire',
  FROST = 'frost',
  SHOCK = 'shock',
  POISON = 'poison',
  SONIC = 'sonic'
}

/**
 * Equipment slots that can be referenced
 */
export enum EquipmentSlot {
  HEAD = 'head',
  BODY = 'body',
  HANDS = 'hands',
  FEET = 'feet',
  AMULET = 'amulet',
  RING = 'ring',
  WEAPON = 'weapon',
  SHIELD = 'shield'
}

/**
 * Analyzed value with metadata
 */
export interface AnalyzedValue {
  raw: string;              // Original raw value string
  type: ValueType;          // Type of value
  magnitude: number;        // Numeric magnitude if applicable
  unit?: string;           // Unit of measurement if applicable
  scaling?: {
    type: 'per_level' | 'per_soul' | 'per_item' | 'per_stack';
    factor: number;
    max?: number;          // Maximum value if capped
  };
}

/**
 * Analyzed condition with metadata
 */
export interface AnalyzedCondition {
  type: ConditionType;
  description: string;      // Human readable description
  trigger: string;         // What triggers the condition
  threshold?: {
    value: number;
    operator: '<' | '>' | '<=' | '>=' | '=';
    resource?: ResourceType;
  };
  equipment?: {
    slot: EquipmentSlot;
    state: 'equipped' | 'unequipped';
    specific?: string;    // Specific item requirement
  };
  environment?: {
    weather?: string;
    location?: string;
    time?: string;
  };
}

/**
 * Analyzed effect scope
 */
export interface AnalyzedScope {
  schools?: MagicSchool[];
  elements?: Element[];
  resources?: ResourceType[];
  equipment?: EquipmentSlot[];
  targets?: string[];      // Types of targets affected
  skills?: string[];      // Skills affected
}

/**
 * Analyzed effect with full metadata
 */
export interface AnalyzedEffect {
  type: EffectType;        // Type of effect from our enum
  value: AnalyzedValue;    // Analyzed value data
  scope?: AnalyzedScope;   // What the effect applies to
  conditions?: AnalyzedCondition[]; // When/how effect triggers
  duration?: {
    length: number;
    type: 'seconds' | 'permanent' | 'conditional';
    stacks?: number;      // Number of times effect can stack
  };
  source: {              // Source record information
    spell?: string;      // Source spell EDID
    mgef?: string;       // Source magic effect EDID
    perk?: string;       // Source perk EDID
  };
}

/**
 * Complete analyzed trait
 */
export interface AnalyzedTrait {
  // Core information
  name: string;
  description: string;
  edid: string;
  
  // Categorization
  category: TraitCategory;
  tags: string[];
  
  // Effects and mechanics
  effects: AnalyzedEffect[];
  
  // Requirements and relationships
  requirements?: {
    level?: number;
    perks?: string[];
    skills?: { [key: string]: number };
    items?: string[];
    resources?: { [key in ResourceType]?: number };
  };
  
  incompatibilities?: {
    traits?: string[];
    races?: string[];
    standing_stones?: boolean;
    vampirism?: boolean;
    lycanthropy?: boolean;
  };
  
  // Technical details
  technical: {
    formId: string;
    plugin: string;
    records: {
      spell: string;
      effects: string[];
      perks: string[];
    };
  };
} 