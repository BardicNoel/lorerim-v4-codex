import { FlstRecordFromSchema } from "../../../types/flstSchema.js";
import { PerkRecordFromSchema } from "../../../types/perkSchema.js";
import { resolveOrderedRecords } from "../../../utils/resolveOrderedRecords.js";
import { formIdResolver } from "../../../utils/formIdResolver.js";

export interface Subclass {
  name: string;
  description: string;
  prerequisites: string[];
  globalFormId: string;
}

/**
 * Extracts prerequisite FormIDs from perk sections
 */
function extractPrerequisiteFormIds(perk: PerkRecordFromSchema): string[] {
  const formIds: string[] = [];
  
  console.log(`     🔍 Extracting prerequisites from perk: ${perk.data.EDID}`);
  console.log(`     - Sections count: ${perk.data.sections?.length || 0}`);
  
  // Check for top-level CTDA conditions (prerequisites)
  if (perk.data.CTDA && Array.isArray(perk.data.CTDA)) {
    console.log(`     - Top-level CTDA conditions count: ${perk.data.CTDA.length}`);
    for (let j = 0; j < perk.data.CTDA.length; j++) {
      const condition = perk.data.CTDA[j];
      console.log(`     - Top-level CTDA ${j + 1}: function=${condition.function.functionName}, param1=${condition.param1}, param2=${condition.param2}`);
      
      // Only look for HasPerk function calls
      if (condition.function.functionName === 'HasPerk') {
        console.log(`     - Found HasPerk condition at top level!`);
        
        // Resolve the FormID using the FormID resolver
        const resolvedFormId = formIdResolver.resolveFormId(condition.param1, perk.meta.plugin);
        if (resolvedFormId) {
          console.log(`     - Resolved prerequisite FormID: ${resolvedFormId} (original: ${condition.param1})`);
          formIds.push(resolvedFormId);
        } else {
          console.log(`     - Failed to resolve prerequisite FormID: ${condition.param1}`);
        }
      }
    }
  }
  
  // Check for CTDA conditions in sections
  if (perk.data.sections && Array.isArray(perk.data.sections)) {
    for (let i = 0; i < perk.data.sections.length; i++) {
      const section = perk.data.sections[i];
      console.log(`     - Section ${i + 1}: ${JSON.stringify(section.PRKE)}`);
      console.log(`     - Section DATA: ${JSON.stringify(section.DATA)}`);
      
      // Check CTDA conditions for HasPerk function calls
      if (section.CTDA && Array.isArray(section.CTDA)) {
        console.log(`     - Section CTDA conditions count: ${section.CTDA.length}`);
        for (let j = 0; j < section.CTDA.length; j++) {
          const condition = section.CTDA[j];
          console.log(`     - Section CTDA ${j + 1}: function=${condition.function.functionName}, param1=${condition.param1}, param2=${condition.param2}`);
          
          // Only look for HasPerk function calls
          if (condition.function.functionName === 'HasPerk') {
            console.log(`     - Found HasPerk condition in section!`);
            
            // Resolve the FormID using the FormID resolver
            const resolvedFormId = formIdResolver.resolveFormId(condition.param1, perk.meta.plugin);
            if (resolvedFormId) {
              console.log(`     - Resolved prerequisite FormID: ${resolvedFormId} (original: ${condition.param1})`);
              formIds.push(resolvedFormId);
            } else {
              console.log(`     - Failed to resolve prerequisite FormID: ${condition.param1}`);
            }
          }
        }
      }
    }
  }
  
  return formIds;
}

// Create a findByFormId function that matches the expected signature
function findByFormId<T extends { meta?: { globalFormId?: string } }>(
  records: T[],
  formId: string
): T | null {
  if (!records || records.length === 0) {
    return null;
  }

  const normalizedFormId = formId.toLowerCase();
  
  return records.find(record => 
    record.meta?.globalFormId?.toLowerCase() === normalizedFormId
  ) || null;
}

/**
 * Resolves subclasses from a FLST record and associated PERK records
 */
export async function resolveSubclasses(
  flstRecord: FlstRecordFromSchema,
  perkRecords: PerkRecordFromSchema[]
): Promise<Subclass[]> {
  console.log(`🔍 Resolving subclasses from FLST: ${flstRecord.data.EDID}`);
  console.log(`   - FLST FormID: ${flstRecord.meta.formId}`);
  console.log(`   - FLST Plugin: ${flstRecord.meta.plugin}`);
  console.log(`   - LNAM entries: ${flstRecord.data.LNAM?.length || 0}`);
  
  // Load the FormID resolver
  try {
    await formIdResolver.loadPluginRegistry();
    console.log(`   - FormID resolver loaded with ${formIdResolver.getPluginCount()} plugins`);
  } catch (error) {
    console.warn(`   - Failed to load FormID resolver: ${error}`);
    console.warn(`   - Will continue without FormID resolution`);
  }

  // First pass: Resolve ordered perks from FLST
  const orderedPerks = resolveOrderedRecords(flstRecord, perkRecords, findByFormId);
  console.log(`   - Resolved ${orderedPerks.length} ordered perks`);

  // Create a Map for efficient perk lookup by FormID
  const perkMap = new Map<string, PerkRecordFromSchema>();
  for (const perk of perkRecords) {
    perkMap.set(perk.meta.globalFormId, perk);
  }

  // Second pass: Map perks to subclasses and resolve prerequisites
  const unresolvedPrereqFormIds = new Set<string>();
  const subclasses = orderedPerks.map((perk, index) => {
    console.log(`   - Mapping perk ${index + 1}: ${perk.data.EDID}`);

    const name = perk.data.FULL || perk.data.EDID || "Unknown";
    const description = perk.data.DESC || "";

    // Extract prerequisite FormIDs from perk sections
    const prerequisiteFormIds = extractPrerequisiteFormIds(perk);
    console.log(`     - Found prerequisite FormIDs: ${JSON.stringify(prerequisiteFormIds)}`);

    // Resolve prerequisites using the collected perk records
    const prerequisites: string[] = [];
    for (const formId of prerequisiteFormIds) {
      const prerequisitePerk = perkMap.get(formId);
      if (prerequisitePerk) {
        const prereqName = prerequisitePerk.data.FULL || prerequisitePerk.data.EDID || "Unknown";
        prerequisites.push(prereqName);
        console.log(`     - Resolved prerequisite: ${prereqName} (${formId})`);
      } else {
        console.log(`     - Unresolved prerequisite FormID: ${formId}`);
        unresolvedPrereqFormIds.add(formId);
      }
    }

    return {
      name,
      description,
      prerequisites,
      globalFormId: perk.meta.globalFormId,
    };
  });

  // After all perks are processed, dump a deduplicated list of unresolved prerequisite FormIDs
  const unresolvedFormIds = Array.from(unresolvedPrereqFormIds);
  if (unresolvedFormIds.length > 0) {
    console.log('\n===== Unresolved Prerequisite FormIDs =====');
    unresolvedFormIds.forEach(id => console.log(`- ${id}`));
    console.log('==========================================\n');
  } else {
    console.log('\nAll prerequisite FormIDs were resolved.\n');
  }

  return subclasses;
}
