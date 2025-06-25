import { JsonArray, ProcessingResult } from '../../types/pipeline';
import { DocGenerator, DocGenConfig } from './doc-gen';
import { ParsedRecord } from '@lorerim/platform-types';

interface PlayerPerkDocConfig {
  outputFormat?: 'markdown' | 'html' | 'json';
  includeConditions?: boolean;
  includeEffects?: boolean;
  groupByCategory?: boolean;
  sortBy?: 'name' | 'level' | 'category';
}

interface PerkSection {
  title: string;
  content: string;
  type: 'header' | 'perk' | 'category' | 'summary';
  metadata?: {
    perkCount?: number;
    category?: string;
    level?: number;
  };
}

interface ProcessedPerk {
  name: string;
  editorId: string;
  level: number;
  category: string;
  description: string;
  conditions: any[];
  effects: any[];
}

export function createPlayerPerkDocGenerator(config: DocGenConfig): DocGenerator {
  let stats: ProcessingResult = {
    perksProcessed: 0,
    sectionsGenerated: 0,
    categoriesFound: 0,
  };

  return {
    async generate(data: JsonArray, docConfig: PlayerPerkDocConfig): Promise<JsonArray> {
      const {
        outputFormat = 'markdown',
        includeConditions = true,
        includeEffects = true,
        groupByCategory = true,
        sortBy = 'name',
      } = docConfig;

      console.log(`[PLAYER-PERK-GEN] Processing ${data.length} perk records...`);

      const sections: PerkSection[] = [];

      // Add header section
      sections.push({
        title: 'Player Perks Documentation',
        content: `Generated from ${data.length} perk records`,
        type: 'header',
      });

      // Process perks
      const processedPerks = data.map((record) => {
        stats.perksProcessed++;
        return processPerkRecord(record, { includeConditions, includeEffects });
      });

      // Group by category if requested
      if (groupByCategory) {
        const categories = groupPerksByCategory(processedPerks);
        stats.categoriesFound = Object.keys(categories).length;

        Object.entries(categories).forEach(([category, perks]) => {
          sections.push({
            title: category,
            content: generateCategoryContent(perks, outputFormat),
            type: 'category',
            metadata: { perkCount: perks.length, category },
          });
        });
      } else {
        // Single section with all perks
        sections.push({
          title: 'All Perks',
          content: generatePerksContent(processedPerks, outputFormat),
          type: 'perk',
          metadata: { perkCount: processedPerks.length },
        });
      }

      // Add summary section
      sections.push({
        title: 'Summary',
        content: generateSummaryContent(stats, outputFormat),
        type: 'summary',
      });

      stats.sectionsGenerated = sections.length;

      // Convert to output format and wrap as ParsedRecord
      return sections.map((section) => ({
        meta: {
          editorId: section.title.toLowerCase().replace(/\s+/g, '_'),
          recordType: 'DOC_SECTION',
          type: 'DOC_SECTION',
          formId: '0x00000000',
          globalFormId: '0x00000000',
          plugin: 'doc-gen',
        },
        record: [
          {
            tag: 'TITLE',
            buffer: Buffer.from(section.title).toString('base64'),
          },
          {
            tag: 'CONTENT',
            buffer: Buffer.from(formatContent(section.content, outputFormat)).toString('base64'),
          },
        ],
        decodedData: {
          title: section.title,
          content: formatContent(section.content, outputFormat),
          type: section.type,
          metadata: section.metadata,
        },
        header: Buffer.from('DOC_SECTION').toString('base64'),
      })) as JsonArray;
    },

    getStats: () => stats,
  };
}

function processPerkRecord(
  record: any,
  options: { includeConditions: boolean; includeEffects: boolean }
): ProcessedPerk {
  const { includeConditions, includeEffects } = options;

  // Extract basic perk information
  const perk: ProcessedPerk = {
    name: record.decodedData?.FULL || record.meta?.editorId || 'Unknown Perk',
    editorId: record.meta?.editorId || 'Unknown',
    level: record.decodedData?.PRKE?.level || 0,
    category: determinePerkCategory(record),
    description: record.decodedData?.DESC || '',
    conditions: includeConditions ? extractConditions(record) : [],
    effects: includeEffects ? extractEffects(record) : [],
  };

  return perk;
}

function determinePerkCategory(record: any): string {
  // Logic to determine perk category based on content
  const name = (record.decodedData?.FULL || '').toLowerCase();
  const editorId = (record.meta?.editorId || '').toLowerCase();

  if (name.includes('combat') || editorId.includes('combat')) return 'Combat';
  if (name.includes('magic') || editorId.includes('magic')) return 'Magic';
  if (name.includes('stealth') || editorId.includes('stealth')) return 'Stealth';
  if (name.includes('crafting') || editorId.includes('crafting')) return 'Crafting';
  if (name.includes('social') || editorId.includes('social')) return 'Social';

  return 'General';
}

function extractConditions(record: any): any[] {
  const conditions: any[] = [];

  if (record.decodedData?.perkSections) {
    record.decodedData.perkSections.forEach((section: any) => {
      if (section.CTDA) {
        conditions.push(...section.CTDA);
      }
    });
  }

  return conditions;
}

function extractEffects(record: any): any[] {
  const effects: any[] = [];

  if (record.decodedData?.perkSections) {
    record.decodedData.perkSections.forEach((section: any) => {
      if (section.PRKE) {
        effects.push(section.PRKE);
      }
    });
  }

  return effects;
}

function groupPerksByCategory(perks: ProcessedPerk[]): Record<string, ProcessedPerk[]> {
  return perks.reduce(
    (groups, perk) => {
      const category = perk.category;
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(perk);
      return groups;
    },
    {} as Record<string, ProcessedPerk[]>
  );
}

function generateCategoryContent(perks: ProcessedPerk[], format: string): string {
  if (format === 'markdown') {
    return perks
      .map((perk) => `- **${perk.name}** (Level ${perk.level})\n  ${perk.description}`)
      .join('\n\n');
  }

  return JSON.stringify(perks, null, 2);
}

function generatePerksContent(perks: ProcessedPerk[], format: string): string {
  if (format === 'markdown') {
    return perks
      .map(
        (perk) =>
          `## ${perk.name}\n\n**Level:** ${perk.level}\n**Category:** ${perk.category}\n\n${perk.description}`
      )
      .join('\n\n');
  }

  return JSON.stringify(perks, null, 2);
}

function generateSummaryContent(stats: ProcessingResult, format: string): string {
  if (format === 'markdown') {
    return `## Summary\n\n- **Total Perks Processed:** ${stats.perksProcessed}\n- **Categories Found:** ${stats.categoriesFound}\n- **Sections Generated:** ${stats.sectionsGenerated}`;
  }

  return JSON.stringify(stats, null, 2);
}

function formatContent(content: string, format: string): string {
  // Additional formatting based on output format
  if (format === 'html') {
    // Convert markdown to HTML (simplified)
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>');
  }

  return content;
}
