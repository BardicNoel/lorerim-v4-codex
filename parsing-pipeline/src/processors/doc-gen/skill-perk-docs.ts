import { JsonArray, ProcessingResult } from '../../types/pipeline';
import { DocGenerator } from './doc-gen';
import { keywordFormIdMap } from '@lorerim/platform-types';

interface SkillPerkDoc {
  skillName: string;
  skillDescription: string;
  skillCategory: string;
  perks: PerkDoc[];
}

interface PerkDoc {
  name: string;
  description: string;
  descriptionDetails?: string;
  requirements?: string;
  prerequisites?: string[];
  effects?: string[];
  keywords?: string[];
  position?: {
    x: number;
    y: number;
  };
  inam?: number;
  connections?: number[];
}

export function createSkillPerkDocsGenerator(config: any): DocGenerator {
  let stats: ProcessingResult = {};

  // Default configuration
  const defaultConfig = {
    includePositionalData: false,
    ...config,
  };

  return {
    async generate(data: JsonArray, docConfig: any): Promise<JsonArray> {
      console.log('[SKILL-PERK-DOCS] Transforming AVIF+PERK data to skill documentation...');

      const startTime = Date.now();
      const skillDocs = transformToSkillPerkDocs(data, { ...defaultConfig, ...docConfig });

      stats = {
        inputRecords: data.length,
        outputRecords: skillDocs.length,
        processingTime: Date.now() - startTime,
        skillsProcessed: skillDocs.length,
        totalPerks: skillDocs.reduce((sum, skill) => sum + skill.perks.length, 0),
      };

      console.log(
        `[SKILL-PERK-DOCS] Generated ${skillDocs.length} skill trees with ${stats.totalPerks} total perks`
      );

      return skillDocs as unknown as JsonArray;
    },

    getStats: () => stats,
  };
}

function transformToSkillPerkDocs(avifPerkData: JsonArray, config: any): SkillPerkDoc[] {
  return avifPerkData.map((skillTree: any) => {
    const skillDoc: SkillPerkDoc = {
      skillName: skillTree.FULL || skillTree.EDID,
      skillDescription: cleanText(skillTree.DESC || ''),
      skillCategory: skillTree.CNAM || 'Unknown',
      perks: [],
    };

    // Process perk sections
    if (skillTree.perkSections && Array.isArray(skillTree.perkSections)) {
      skillDoc.perks = skillTree.perkSections
        .filter((section: any) => section.PERK) // Only include sections with actual perks
        .map((section: any) => {
          const perk = section.PERK;
          const perkDoc: PerkDoc = {
            name: perk.FULL || perk.EDID || 'Unknown Perk',
            description: cleanText(perk.DESC || ''),
          };

          // Add positional data if configured
          if (config.includePositionalData) {
            perkDoc.position = {
              x: section.XNAM || 0,
              y: section.YNAM || 0,
            };
            perkDoc.inam = section.INAM;
            perkDoc.connections = section.CNAM || [];
          }

          // Always add core fields if they exist
          const requirements = extractRequirements(perk, skillTree.perkSections);
          if (requirements) {
            perkDoc.requirements = requirements;
          }

          const prerequisites = extractPrerequisites(section, skillTree.perkSections);
          if (prerequisites.length > 0) {
            perkDoc.prerequisites = prerequisites;
          }

          const effects = extractEffects(perk);
          if (effects && effects.length > 0) {
            perkDoc.effects = effects;
          }

          const descriptionDetails = extractDescriptionDetails(perk.DESC || '');
          if (descriptionDetails) {
            perkDoc.descriptionDetails = descriptionDetails;
          }

          const keywords = extractKeywords(perk, skillTree.perkSections, skillTree.FULL);
          if (keywords.length > 0) {
            perkDoc.keywords = keywords;
          }

          return perkDoc;
        });
    }

    return skillDoc;
  });
}

function cleanText(text: string): string {
  return text
    .replace(/<br\s*\/?>/gi, '\n') // Replace <br> tags with newlines
    .replace(/<[^>]*>/g, '') // Remove any other HTML tags
    .replace(/\s*\[.*?\]\s*/g, '') // Remove bracketed content
    .replace(/\n\s*\n/g, '\n') // Remove multiple consecutive newlines
    .replace(/^\s+|\s+$/g, '') // Trim leading/trailing whitespace
    .replace(/\s+/g, ' '); // Normalize multiple spaces to single space
}

function extractRequirements(perk: any, allPerkSections: any[]): string | undefined {
  const requirements: string[] = [];

  // Check perk-level CTDA conditions for skill level requirements
  if (perk.CTDA && Array.isArray(perk.CTDA)) {
    perk.CTDA.forEach((ctda: any) => {
      if (ctda.function?.functionName === 'GetBaseActorValue (GetBaseAV)') {
        const level = ctda.comparisonValue;
        if (level) {
          requirements.push(`Skill Level ${level}`);
        }
      }
    });
  }

  // Check section-level CTDA conditions for skill level requirements
  if (perk.sections && Array.isArray(perk.sections)) {
    perk.sections.forEach((section: any) => {
      if (section.CTDA && Array.isArray(section.CTDA)) {
        section.CTDA.forEach((ctda: any) => {
          if (ctda.function?.functionName === 'GetBaseActorValue (GetBaseAV)') {
            const level = ctda.comparisonValue;
            if (level) {
              requirements.push(`Skill Level ${level}`);
            }
          }
        });
      }
    });
  }

  return requirements.length > 0 ? requirements.join(', ') : undefined;
}

function extractPrerequisites(section: any, allPerkSections: any[]): string[] {
  const prerequisites: string[] = [];

  if (section.CNAM && Array.isArray(section.CNAM)) {
    section.CNAM.forEach((connectionIndex: number) => {
      // Find the perk section with matching INAM
      const prerequisiteSection = allPerkSections.find((s) => s.INAM === connectionIndex);
      if (prerequisiteSection && prerequisiteSection.PERK) {
        const perkName = prerequisiteSection.PERK.FULL || prerequisiteSection.PERK.EDID;
        prerequisites.push(perkName);
      }
    });
  }

  return prerequisites;
}

function extractEffects(perk: any): string[] | undefined {
  if (!perk.sections || !Array.isArray(perk.sections)) {
    return undefined;
  }

  const effects: string[] = [];

  perk.sections.forEach((section: any) => {
    if (section.DATA?.effectType) {
      const effectType = section.DATA.effectType;
      const functionType = section.DATA.functionType;

      if (effectType && functionType) {
        effects.push(`${effectType} - ${functionType}`);
      } else if (effectType) {
        effects.push(effectType);
      }
    }
  });

  return effects.length > 0 ? effects : undefined;
}

function extractDescriptionDetails(description: string): string | null {
  const detailsMatch = description.match(/\[(.*?)\]/);
  return detailsMatch ? detailsMatch[1] : null;
}

function extractKeywords(perk: any, allPerkSections: any[], skillName: string): string[] {
  const keywords: string[] = [];

  // Check PERK sections CTDA conditions - this is where the actual perk CTDA data is
  if (perk.sections && Array.isArray(perk.sections)) {
    perk.sections.forEach((section: any) => {
      if (section.CTDA && Array.isArray(section.CTDA)) {
        section.CTDA.forEach((ctda: any) => {
          extractKeywordsFromCTDA(ctda, keywords, skillName);
        });
      }
    });
  }

  // Also check if the perk itself has CTDA data directly
  if (perk.CTDA && Array.isArray(perk.CTDA)) {
    perk.CTDA.forEach((ctda: any) => {
      extractKeywordsFromCTDA(ctda, keywords, skillName);
    });
  }

  return [...new Set(keywords)]; // Remove duplicates
}

function extractKeywordsFromCTDA(ctda: any, keywords: string[], skillName: string): void {
  // DEBUG: Log the CTDA object to inspect its structure
  if (process.env.DEBUG_SKILL_PERK_DOCS) {
    // Only log if the debug env var is set
    // eslint-disable-next-line no-console
    console.log('[DEBUG][CTDA]', JSON.stringify(ctda, null, 2));
  }

  const functionIndex = ctda.function?.functionIndex;
  const functionName = ctda.function?.functionName;

  // Always include the skill name
  keywords.push(skillName);

  // Handle by function index first (more reliable)
  switch (functionIndex) {
    case 560: // HasKeyword
    case 682: // WornHasKeyword
    case 699: // HasMagicEffectKeyword
    case 693: // EPMagic_SpellHasKeyword
      if (ctda.reference && ctda.reference !== '0x00000000') {
        const resolved = keywordFormIdMap[ctda.reference] || `Keyword: ${ctda.reference}`;
        keywords.push(resolved);
      } else {
        // eslint-disable-next-line no-console
        console.warn(`[CTDA] HasKeyword function missing reference: ${JSON.stringify(ctda)}`);
      }
      break;

    case 182: // GetEquipped
    case 597: // GetEquippedItemType
      if (ctda.reference && ctda.reference !== '0x00000000') {
        keywords.push(`Equipment: ${ctda.reference}`);
      } else {
        // eslint-disable-next-line no-console
        console.warn(`[CTDA] GetEquipped function missing reference: ${JSON.stringify(ctda)}`);
      }
      break;

    case 109: // IsWeaponSkillType
      if (ctda.comparisonValue !== undefined) {
        const weaponTypes: Record<number, string> = {
          0: 'One-Handed Sword',
          1: 'One-Handed Dagger',
          2: 'One-Handed Axe',
          3: 'One-Handed Mace',
          4: 'Two-Handed Sword',
          5: 'Two-Handed Axe',
          6: 'Two-Handed Hammer',
          7: 'Bow',
          8: 'Staff',
          9: 'Crossbow',
        };
        const weaponType =
          weaponTypes[ctda.comparisonValue as number] || `Weapon Type ${ctda.comparisonValue}`;
        keywords.push(weaponType);
      }
      break;

    case 432: // GetIsObjectType
      if (ctda.comparisonValue !== undefined) {
        const itemTypes: Record<number, string> = {
          0: 'Weapon',
          1: 'Armor',
          2: 'Clothing',
          3: 'Book',
          4: 'Ingredient',
          5: 'Light',
          6: 'Misc',
          7: 'Scroll',
          8: 'Staff',
          9: 'Ammo',
        };
        const itemType =
          itemTypes[ctda.comparisonValue as number] || `Item Type ${ctda.comparisonValue}`;
        keywords.push(itemType);
      }
      break;

    case 14: // GetActorValue (GetAV)
    case 277: // GetBaseActorValue (GetBaseAV)
      // Check if this is a skill check (reference 6-23 are skills)
      if (ctda.reference >= 6 && ctda.reference <= 23) {
        const skillNames: Record<number, string> = {
          6: 'One-Handed',
          7: 'Two-Handed',
          8: 'Marksman',
          9: 'Block',
          10: 'Smithing',
          11: 'Heavy Armor',
          12: 'Light Armor',
          13: 'Pickpocket',
          14: 'Lockpicking',
          15: 'Sneak',
          16: 'Alchemy',
          17: 'Speechcraft',
          18: 'Alteration',
          19: 'Conjuration',
          20: 'Destruction',
          21: 'Illusion',
          22: 'Restoration',
          23: 'Enchanting',
        };
        const skillName = skillNames[ctda.reference as number] || `Skill ${ctda.reference}`;
        keywords.push(skillName);
      } else {
        // eslint-disable-next-line no-console
        console.warn(
          `[CTDA] GetActorValue function with non-skill reference: ${JSON.stringify(ctda)}`
        );
      }
      break;

    case 636: // HasTwoHandedWeaponEquipped
      keywords.push('Two-Handed Weapon');
      break;

    case 706: // HasBoundWeaponEquipped
      keywords.push('Bound Weapon');
      break;

    case 672: // IsAttacking
      keywords.push('Combat');
      break;

    case 673: // IsPowerAttacking
      keywords.push('Power Attack');
      break;

    case 286: // IsSneaking
      keywords.push('Sneak');
      break;

    case 263: // IsWeaponOut
      keywords.push('Weapon Drawn');
      break;

    case 101: // IsWeaponMagicOut
      keywords.push('Magic Weapon');
      break;

    case 72: // GetIsID
      // eslint-disable-next-line no-console
      console.warn(`[CTDA] Unhandled GetIsID function: ${JSON.stringify(ctda)}`);
      break;

    case 389: // IsAttackType (example index, update if needed)
      if (ctda.comparisonValue !== undefined) {
        const attackTypes: Record<number, string> = {
          0: 'Sword',
          1: 'Dagger',
          2: 'Axe',
          3: 'Mace',
          4: 'Greatsword',
          5: 'Battleaxe',
          6: 'Warhammer',
          7: 'Bow',
          8: 'Staff',
          9: 'Crossbow',
        };
        const attackType =
          attackTypes[ctda.comparisonValue as number] || `Attack Type ${ctda.comparisonValue}`;
        keywords.push(attackType);
      } else {
        // eslint-disable-next-line no-console
        console.warn(
          `[CTDA] IsAttackType function missing comparison value: ${JSON.stringify(ctda)}`
        );
      }
      break;

    case 701: // IsStaggered
      keywords.push('Stagger');
      break;

    case 448: // HasPerk
      if (ctda.reference && ctda.reference !== '0x00000000') {
        keywords.push(`Perk: ${ctda.reference}`);
      } else {
        // eslint-disable-next-line no-console
        console.warn(`[CTDA] HasPerk function missing reference: ${JSON.stringify(ctda)}`);
      }
      break;

    default:
      // If no function index match, try by function name
      if (functionName) {
        switch (functionName) {
          case 'HasKeyword':
          case 'WornHasKeyword':
          case 'HasMagicEffectKeyword':
          case 'EPMagic_SpellHasKeyword':
            if (ctda.reference && ctda.reference !== '0x00000000') {
              const resolved = keywordFormIdMap[ctda.reference] || `Keyword: ${ctda.reference}`;
              keywords.push(resolved);
            } else {
              // eslint-disable-next-line no-console
              console.warn(`[CTDA] HasKeyword function missing reference: ${JSON.stringify(ctda)}`);
            }
            break;

          case 'GetEquipped':
          case 'GetEquippedItemType':
            if (ctda.reference && ctda.reference !== '0x00000000') {
              keywords.push(`Equipment: ${ctda.reference}`);
            } else {
              // eslint-disable-next-line no-console
              console.warn(
                `[CTDA] GetEquipped function missing reference: ${JSON.stringify(ctda)}`
              );
            }
            break;

          case 'IsWeaponSkillType':
            if (ctda.comparisonValue !== undefined) {
              const weaponTypes: Record<number, string> = {
                0: 'One-Handed Sword',
                1: 'One-Handed Dagger',
                2: 'One-Handed Axe',
                3: 'One-Handed Mace',
                4: 'Two-Handed Sword',
                5: 'Two-Handed Axe',
                6: 'Two-Handed Hammer',
                7: 'Bow',
                8: 'Staff',
                9: 'Crossbow',
              };
              const weaponType =
                weaponTypes[ctda.comparisonValue as number] ||
                `Weapon Type ${ctda.comparisonValue}`;
              keywords.push(weaponType);
            }
            break;

          case 'GetIsObjectType':
            if (ctda.comparisonValue !== undefined) {
              const itemTypes: Record<number, string> = {
                0: 'Weapon',
                1: 'Armor',
                2: 'Clothing',
                3: 'Book',
                4: 'Ingredient',
                5: 'Light',
                6: 'Misc',
                7: 'Scroll',
                8: 'Staff',
                9: 'Ammo',
              };
              const itemType =
                itemTypes[ctda.comparisonValue as number] || `Item Type ${ctda.comparisonValue}`;
              keywords.push(itemType);
            }
            break;

          case 'GetActorValue (GetAV)':
          case 'GetBaseActorValue (GetBaseAV)':
            // Check if this is a skill check (reference 6-23 are skills)
            if (ctda.reference >= 6 && ctda.reference <= 23) {
              const skillNames: Record<number, string> = {
                6: 'One-Handed',
                7: 'Two-Handed',
                8: 'Marksman',
                9: 'Block',
                10: 'Smithing',
                11: 'Heavy Armor',
                12: 'Light Armor',
                13: 'Pickpocket',
                14: 'Lockpicking',
                15: 'Sneak',
                16: 'Alchemy',
                17: 'Speechcraft',
                18: 'Alteration',
                19: 'Conjuration',
                20: 'Destruction',
                21: 'Illusion',
                22: 'Restoration',
                23: 'Enchanting',
              };
              const skillName = skillNames[ctda.reference as number] || `Skill ${ctda.reference}`;
              keywords.push(skillName);
            } else {
              // eslint-disable-next-line no-console
              console.warn(
                `[CTDA] GetActorValue function with non-skill reference: ${JSON.stringify(ctda)}`
              );
            }
            break;

          case 'HasTwoHandedWeaponEquipped':
            keywords.push('Two-Handed Weapon');
            break;

          case 'HasBoundWeaponEquipped':
            keywords.push('Bound Weapon');
            break;

          case 'IsAttacking':
            keywords.push('Combat');
            break;

          case 'IsPowerAttacking':
            keywords.push('Power Attack');
            break;

          case 'IsSneaking':
            keywords.push('Sneak');
            break;

          case 'IsWeaponOut':
            keywords.push('Weapon Drawn');
            break;

          case 'IsWeaponMagicOut':
            keywords.push('Magic Weapon');
            break;

          case 'GetIsID':
            // eslint-disable-next-line no-console
            console.warn(`[CTDA] Unhandled GetIsID function: ${JSON.stringify(ctda)}`);
            break;

          case 'IsAttackType':
            if (ctda.comparisonValue !== undefined) {
              const attackTypes: Record<number, string> = {
                0: 'Sword',
                1: 'Dagger',
                2: 'Axe',
                3: 'Mace',
                4: 'Greatsword',
                5: 'Battleaxe',
                6: 'Warhammer',
                7: 'Bow',
                8: 'Staff',
                9: 'Crossbow',
              };
              const attackType =
                attackTypes[ctda.comparisonValue as number] ||
                `Attack Type ${ctda.comparisonValue}`;
              keywords.push(attackType);
            } else {
              // eslint-disable-next-line no-console
              console.warn(
                `[CTDA] IsAttackType function missing comparison value: ${JSON.stringify(ctda)}`
              );
            }
            break;

          case 'IsStaggered':
            keywords.push('Stagger');
            break;

          case 'HasPerk':
            if (ctda.reference && ctda.reference !== '0x00000000') {
              keywords.push(`Perk: ${ctda.reference}`);
            } else {
              // eslint-disable-next-line no-console
              console.warn(`[CTDA] HasPerk function missing reference: ${JSON.stringify(ctda)}`);
            }
            break;

          default:
            // eslint-disable-next-line no-console
            console.warn(
              `[CTDA] Unhandled function: ${functionName} (Index: ${functionIndex}) - ${JSON.stringify(ctda)}`
            );
            break;
        }
      } else {
        // eslint-disable-next-line no-console
        console.warn(`[CTDA] Unknown function index: ${functionIndex} - ${JSON.stringify(ctda)}`);
      }
      break;
  }
}

// Main function for direct execution
async function main() {
  const args = process.argv.slice(2);
  const inputFile = args[0];
  const outputFile = args[1];

  if (!inputFile || !outputFile) {
    console.error('Usage: ts-node skill-perk-docs.ts <inputFile> <outputFile>');
    process.exit(1);
  }

  try {
    const fs = require('fs').promises;
    const inputData = JSON.parse(await fs.readFile(inputFile, 'utf-8'));

    const config = { includePositionalData: false };
    const generator = createSkillPerkDocsGenerator(config);
    const result = await generator.generate(inputData, config);

    await fs.writeFile(outputFile, JSON.stringify(result, null, 2));
    console.log(`Generated skill-perk docs with ${result.length} skill trees`);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
