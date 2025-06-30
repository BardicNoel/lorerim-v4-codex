import { MgefRecordFromSchema } from "../../../types/mgefSchema.js";
import { SpelRecordFromSchema } from "../../../types/spelSchema.js";
import { 
  EffectType,
  TraitCategory,
  StructuredEffect
} from "../types.js";

/**
 * Maps MGEF effect types to our structured effect types
 */
const effectTypeMap = new Map<string, EffectType>([
  ["Value Modifier", EffectType.DAMAGE_DEALT],
  ["Script", EffectType.SPECIAL],
  ["Dispel", EffectType.SPECIAL],
  ["Cure Disease", EffectType.SPECIAL],
  ["Absorb", EffectType.SPECIAL],
  ["Dual Value Modifier", EffectType.DAMAGE_DEALT],
  ["Calm", EffectType.SPECIAL],
  ["Demoralize", EffectType.SPECIAL],
  ["Frenzy", EffectType.SPECIAL],
  ["Disarm", EffectType.SPECIAL],
  ["Command Summoned", EffectType.SPECIAL],
  ["Invisibility", EffectType.SPECIAL],
  ["Light", EffectType.SPECIAL],
  ["Lock", EffectType.SPECIAL],
  ["Open", EffectType.SPECIAL],
  ["Bound Weapon", EffectType.SPECIAL],
  ["Summon Creature", EffectType.SPECIAL],
  ["Detect Life", EffectType.SPECIAL],
  ["Telekinesis", EffectType.SPECIAL],
  ["Paralysis", EffectType.SPECIAL],
  ["Reanimate", EffectType.SPECIAL],
  ["Soul Trap", EffectType.SPECIAL],
  ["Turn Undead", EffectType.SPECIAL],
  ["Guide", EffectType.SPECIAL],
  ["Werewolf Feed", EffectType.SPECIAL],
  ["Cure Paralysis", EffectType.SPECIAL],
  ["Cure Addiction", EffectType.SPECIAL],
  ["Cure Poison", EffectType.SPECIAL],
  ["Concussion", EffectType.SPECIAL],
  ["Value And Parts", EffectType.SPECIAL],
  ["Accumulate Magnitude", EffectType.SPECIAL],
  ["Stagger", EffectType.SPECIAL]
]);

/**
 * Determines the primary category for a trait based on its effects
 */
export function determineCategories(
  spell: SpelRecordFromSchema,
  primaryMgef: MgefRecordFromSchema
): TraitCategory {
  const desc = spell.data.DESC?.toLowerCase() || "";
  const edid = spell.data.EDID?.toLowerCase() || "";
  const mgefDesc = primaryMgef.data.DNAM?.toLowerCase() || "";
  
  // Check for magic-related terms
  if (
    desc.includes("spell") ||
    desc.includes("magic") ||
    mgefDesc.includes("spell") ||
    mgefDesc.includes("magic")
  ) {
    return TraitCategory.MAGIC;
  }
  
  // Check for combat-related terms
  if (
    desc.includes("damage") ||
    desc.includes("attack") ||
    desc.includes("weapon") ||
    mgefDesc.includes("damage") ||
    mgefDesc.includes("attack")
  ) {
    return TraitCategory.COMBAT;
  }
  
  // Check for social-related terms
  if (
    desc.includes("merchant") ||
    desc.includes("follower") ||
    desc.includes("speech") ||
    mgefDesc.includes("merchant") ||
    mgefDesc.includes("follower")
  ) {
    return TraitCategory.SOCIAL;
  }
  
  // Check for crafting-related terms
  if (
    desc.includes("craft") ||
    desc.includes("create") ||
    desc.includes("forge") ||
    mgefDesc.includes("craft") ||
    mgefDesc.includes("create")
  ) {
    return TraitCategory.CRAFTING;
  }
  
  // Default to special if no other category matches
  return TraitCategory.SPECIAL;
}

/**
 * Formats a value with proper sign and unit
 */
function formatValue(magnitude: number, isPercentage = false): string {
  const prefix = magnitude >= 0 ? '+' : '';
  const suffix = isPercentage ? '%' : '';
  return `${prefix}${magnitude}${suffix}`;
}

/**
 * Analyzes a script effect to determine its actual purpose
 */
function analyzeScriptEffect(mgef: MgefRecordFromSchema): EffectType {
  const edid = mgef.data.EDID.toLowerCase();
  const desc = mgef.data.DNAM?.toLowerCase() || "";
  const flags = mgef.data.DATA?.flags || [];
  const primaryAV = mgef.data.DATA?.primaryAV;

  // Check for common script effect patterns
  if (edid.includes('visual') || edid.includes('fx') || flags.includes('FX Persist')) {
    return EffectType.SPECIAL; // Visual effects
  }

  if (edid.includes('proc') || desc.includes('when') || desc.includes('if')) {
    return EffectType.SPECIAL; // Script-driven effects
  }

  // Check for specific mechanics in description
  if (desc.includes('damage')) return EffectType.DAMAGE_DEALT;
  if (desc.includes('resist')) return EffectType.DAMAGE_TAKEN;
  if (desc.includes('spell') || desc.includes('magic')) return EffectType.SPELL_POWER;
  if (desc.includes('craft') || desc.includes('create')) return EffectType.CRAFTING_SPEED;
  if (desc.includes('merchant') || desc.includes('price')) return EffectType.MERCHANT_PRICES;
  if (desc.includes('follower')) return EffectType.FOLLOWER_COST;

  return EffectType.SPECIAL; // Default to special if no clear category
}

/**
 * Extracts a more detailed condition from MGEF data and description
 */
function extractCondition(mgef: MgefRecordFromSchema): string | undefined {
  const desc = mgef.data.DNAM?.toLowerCase() || "";
  const flags = mgef.data.DATA?.flags || [];
  let conditions: string[] = [];
  
  // Look for common condition patterns
  if (desc.includes("when") || desc.includes("while") || desc.includes("if")) {
    const conditionMatch = desc.match(/(when|while|if)\s+([^\.]+)/i);
    if (conditionMatch) {
      conditions.push(conditionMatch[0]);
    }
  }

  // Add flag-based conditions
  if (flags.includes("No Hit Event")) {
    conditions.push("passive effect");
  }
  if (flags.includes("Detrimental")) {
    conditions.push("negative effect");
  }
  if (flags.includes("Recover")) {
    conditions.push("recovery effect");
  }
  if (flags.includes("Power Affects Magnitude")) {
    conditions.push("scales with power");
  }
  if (flags.includes("Power Affects Duration")) {
    conditions.push("duration scales with power");
  }

  return conditions.length > 0 ? conditions.join(", ") : undefined;
}

/**
 * Enhances a spell effect with MGEF data into our structured format
 */
export function enhanceEffect(
  spell: SpelRecordFromSchema,
  spelEffect: SpelRecordFromSchema["data"]["effects"][0],
  mgef: MgefRecordFromSchema
): StructuredEffect {
  let effectType = effectTypeMap.get(mgef.data.DATA?.effectType || "Value Modifier") || EffectType.SPECIAL;
  
  // If it's a script effect, analyze it further
  if (effectType === EffectType.SPECIAL) {
    effectType = analyzeScriptEffect(mgef);
  }

  const magnitude = spelEffect.EFIT?.magnitude ?? 0;
  const condition = extractCondition(mgef);
  
  // Format value based on effect type
  const value = magnitude;
  const flags = mgef.data.DATA?.flags || [];
  
  return {
    type: effectType,
    value,
    condition,
    duration: spelEffect.EFIT?.duration,
    flags
  };
} 