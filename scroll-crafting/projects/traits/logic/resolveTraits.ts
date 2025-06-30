import { SpelRecordFromSchema } from "../../../types/spelSchema.js";
import { MgefRecordFromSchema } from "../../../types/mgefSchema.js";
import { EnhancedTrait, TraitDefinition, StructuredEffect } from "../types.js";
import { enhanceEffect } from "./enhanceEffects.js";
import { determineCategories } from "./enhanceEffects.js";
import { createMermaidFlowchart } from '../../../utils/mermaid.js';

/**
 * Formats bracketed values in descriptions with bold and italics.
 * Converts <value> to ***value***
 */
function formatBracketedValues(description: string): string {
  return description.replace(/<([^>]+)>/g, '***$1***');
}

/**
 * Extracts spell information from a SPEL record
 */
function extractSpellInfo(spell: SpelRecordFromSchema) {
  return {
    cost: spell.data.SPIT?.spellCost ?? 0,
    type: spell.data.SPIT?.type ?? "",
    castType: spell.data.SPIT?.castType ?? "",
    delivery: spell.data.SPIT?.delivery ?? ""
  };
}

/**
 * Resolves a trait from a SPEL record with enhanced effect information
 */
export function resolveSpellTrait(
  spell: SpelRecordFromSchema,
  getMgef: (formId: string) => MgefRecordFromSchema
): EnhancedTrait {
  if (!spell.data) {
    throw new Error(`Spell record ${spell.meta.globalFormId} has no data`);
  }

  // Get base trait information
  const base = {
    name: spell.data.FULL || spell.data.EDID || "",
    description: formatBracketedValues(spell.data.DESC || ""),
    edid: spell.data.EDID || "",
    formId: spell.meta.globalFormId
  };

  // Get spell info
  const spellInfo = extractSpellInfo(spell);

  // Enhance each effect
  const effects = spell.data.effects.map(effect => {
    const mgef = getMgef(effect.EFID);
    return enhanceEffect(spell, effect, mgef);
  });

  // Get categories from first MGEF (primary effect)
  const firstMgef = getMgef(spell.data.effects[0].EFID);
  const category = determineCategories(spell, firstMgef);
  const tags = [category]; // For now, just use the primary category as a tag

  return {
    ...base,
    spell: spellInfo,
    effects,
    category,
    tags,
    diagram: ''
  };
}

/**
 * Legacy trait resolution function for backward compatibility
 */
export function resolveLegacyTrait(
  spell: SpelRecordFromSchema
): TraitDefinition {
  if (!spell.data) {
    throw new Error(`Spell record ${spell.meta.globalFormId} has no data`);
  }

  return {
    name: spell.data.FULL || spell.data.EDID || "",
    description: formatBracketedValues(spell.data.DESC || ""),
    edid: spell.data.EDID || "",
    formId: spell.meta.globalFormId
  };
}

/**
 * Resolves an array of trait spells into enhanced trait definitions.
 * The spells passed in should already be filtered, merged, and deduplicated
 * (from the traits formlist and EDID pattern matching).
 */
export function resolveTraits(
  traitSpells: SpelRecordFromSchema[],
  getMgef: (formId: string) => MgefRecordFromSchema
): EnhancedTrait[] {
  return traitSpells
    .map(spell => resolveSpellTrait(spell, getMgef))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Legacy resolution function for backward compatibility
 */
export function resolveLegacyTraits(
  traitSpells: SpelRecordFromSchema[]
): TraitDefinition[] {
  return traitSpells
    .map(resolveLegacyTrait)
    .sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Generates a Mermaid diagram showing effect relationships
 */
function generateEffectDiagram(trait: EnhancedTrait): string {
  const nodes: string[] = [];
  const edges: string[] = [];
  
  // Add trait node
  nodes.push(`trait["${trait.name}"]`);
  
  // Add effect nodes and connect them
  trait.effects.forEach((effect: StructuredEffect, idx: number) => {
    const nodeId = `effect${idx}`;
    const label = `${effect.type}${effect.value ? `: ${effect.value}` : ''}`;
    nodes.push(`${nodeId}["${label}"]`);
    edges.push(`trait --> ${nodeId}`);
    
    // Add condition nodes if present
    if (effect.condition) {
      const condId = `cond${idx}`;
      nodes.push(`${condId}["${effect.condition}"]`);
      edges.push(`${nodeId} -.-> ${condId}`);
    }
    
    // Add scope nodes if present
    if (effect.scope) {
      const scopeId = `scope${idx}`;
      const scopeLabel = [effect.scope.school, effect.scope.element]
        .filter(Boolean)
        .join('/');
      if (scopeLabel) {
        nodes.push(`${scopeId}["${scopeLabel}"]`);
        edges.push(`${nodeId} -.-> ${scopeId}`);
      }
    }
  });
  
  const lines = [
    'graph TD',
    'classDef default fill:#f9f9f9,stroke:#333,stroke-width:2px',
    'classDef condition fill:#e1f5fe,stroke:#0288d1,stroke-width:2px',
    'classDef scope fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px',
    ...nodes,
    ...edges,
    'class trait default',
    ...trait.effects.map((_, idx) => `class effect${idx} default`),
    ...trait.effects.map((_, idx) => `class cond${idx} condition`),
    ...trait.effects.map((_, idx) => `class scope${idx} scope`)
  ];

  return createMermaidFlowchart(lines);
}

/**
 * Enhances an existing trait with additional information
 */
export function enhanceExistingTrait(
  trait: EnhancedTrait,
  mgefRecords: MgefRecordFromSchema[],
  spelRecords: SpelRecordFromSchema[]
): EnhancedTrait {
  const enhancedTrait: EnhancedTrait = {
    ...trait,
    effects: trait.effects.map((effect: StructuredEffect) => {
      const mgef = mgefRecords.find(m => m.data.EDID === effect.mgefEdid);
      if (!mgef) {
        return effect;
      }
      const enhanced = enhanceEffect({
        meta: {
          type: 'SPEL',
          formId: trait.formId,
          globalFormId: trait.formId,
          plugin: 'dummy.esp'
        },
        data: {
          EDID: trait.edid,
          FULL: trait.name,
          ETYP: '',
          DESC: trait.description,
          SPIT: {
            spellCost: 0,
            flags: [],
            type: "Spell",
            chargeTime: 0,
            castType: "FireAndForget",
            delivery: "Self",
            castDuration: 0,
            range: 0,
            halfCostPerk: ''
          },
          effects: []
        }
      }, {
        EFID: mgef.meta.globalFormId,
        EFIT: {
          magnitude: effect.value,
          duration: effect.duration || 0,
          area: effect.area || 0
        }
      }, mgef);
      return {
        ...enhanced,
        mgefEdid: effect.mgefEdid
      };
    }),
    diagram: ''
  };
  
  enhancedTrait.diagram = generateEffectDiagram(enhancedTrait);
  return enhancedTrait;
} 