import { JsonArray, ProcessingResult } from '../../types/pipeline';
import { Processor } from '../core';
import { createPlayerPerkDocGenerator } from './hold-player-perk-gen-md';
import { createSkillPerkDocsGenerator } from './skill-perk-docs';
import { createReligionDocsGenerator } from './religion-docs';

// Document generator interface
export interface DocGenerator {
  generate: (data: JsonArray, config: any) => Promise<JsonArray>;
  getStats?: () => ProcessingResult;
}

// Available document types
export type DocType = 'player-perk' | 'skill-perk-docs' | 'religion-docs';

// Doc-gen stage configuration
export interface DocGenConfig {
  name: string;
  description?: string;
  type: 'doc-gen';
  enabled?: boolean;
  docType: DocType;
  outputFormat?: 'markdown' | 'html' | 'json';
  template?: string; // Optional template path
  [key: string]: any; // Additional configuration for specific doc types
}

// Document generator registry
const docGenerators: Record<DocType, (config: DocGenConfig) => DocGenerator> = {
  'player-perk': createPlayerPerkDocGenerator,
  'skill-perk-docs': createSkillPerkDocsGenerator,
  'religion-docs': createReligionDocsGenerator,
};

export function createDocGenProcessor(config: DocGenConfig): Processor {
  const { docType, ...docConfig } = config;

  if (!docGenerators[docType]) {
    throw new Error(`Unknown document type: ${docType}`);
  }

  const generator = docGenerators[docType](config);
  let stats: ProcessingResult = {};

  return {
    async transform(data: JsonArray): Promise<JsonArray> {
      console.log(`[DOC-GEN] Generating ${docType} documentation...`);

      const result = await generator.generate(data, docConfig);

      if (generator.getStats) {
        stats = generator.getStats();
      }

      console.log(`[DOC-GEN] Generated ${docType} documentation with ${result.length} sections`);
      return result;
    },

    getStats: () => stats,
  };
}

// Export for use in pipeline
export { createPlayerPerkDocGenerator };
