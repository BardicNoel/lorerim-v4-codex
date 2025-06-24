import { JsonArray, ProcessingResult } from '../../types/pipeline';
import { DocGenerator, DocGenConfig } from './doc-gen';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

interface ReligionProperty {
  name: string;
  values: any[];
}

interface StructuredDeity {
  name: string;
  type?: string;
  blessing?: any;
  boon1?: any;
  boon2?: any;
  tenet?: string;
  favoredRaces: string[];
}

interface ReligionConfig {
  name: string;
  description: string;
  outputFormat: 'json' | 'markdown' | 'html';
  groupByType: boolean;
  sortByName: boolean;
  includeFormIds: boolean;
  includeBlessings: boolean;
  includeBoons: boolean;
  includeTenets: boolean;
  includeFavoredRaces: boolean;
  raceNameMapping: Record<string, string>;
  divineTypeDescriptions: Record<string, string>;
  markdownTemplate: {
    includeHeader: boolean;
    includeTableOfContents: boolean;
    includeTypeSections: boolean;
    includeEffectDetails: boolean;
    includeFormIdReferences: boolean;
  };
  htmlTemplate: {
    includeCSS: boolean;
    includeNavigation: boolean;
    includeSearch: boolean;
    responsiveDesign: boolean;
  };
  effectResolution: {
    resolveSpellNames: boolean;
    resolveEffectDescriptions: boolean;
    includeMagnitude: boolean;
    includeDuration: boolean;
  };
  validation: {
    requireName: boolean;
    requireType: boolean;
    validateFormIds: boolean;
    checkForMissingData: boolean;
  };
  performance: {
    batchSize: number;
    enableCaching: boolean;
    parallelProcessing: boolean;
  };
}

function loadReligionConfig(configPath?: string): ReligionConfig {
  const defaultConfig: ReligionConfig = {
    name: "Religion Documentation Config",
    description: "Configuration for generating structured religion documentation",
    outputFormat: "json",
    groupByType: true,
    sortByName: true,
    includeFormIds: true,
    includeBlessings: true,
    includeBoons: true,
    includeTenets: true,
    includeFavoredRaces: true,
    raceNameMapping: {
      "0x00013743": "Altmer",
      "0x00088840": "Bosmer",
      "0x00013749": "Dunmer",
      "0x00088884": "Argonian",
      "0x00000000": "None"
    },
    divineTypeDescriptions: {
      "Divine": "The Nine Divines, the primary deities of the Imperial pantheon",
      "Ancestor": "Ancestor spirits and cultural deities",
      "Daedric Prince": "The Daedric Princes, powerful entities of Oblivion",
      "Cultural": "Deities specific to particular cultures and regions",
      "Other": "Other divine entities and spirits"
    },
    markdownTemplate: {
      includeHeader: true,
      includeTableOfContents: true,
      includeTypeSections: true,
      includeEffectDetails: true,
      includeFormIdReferences: true
    },
    htmlTemplate: {
      includeCSS: true,
      includeNavigation: true,
      includeSearch: true,
      responsiveDesign: true
    },
    effectResolution: {
      resolveSpellNames: true,
      resolveEffectDescriptions: true,
      includeMagnitude: true,
      includeDuration: true
    },
    validation: {
      requireName: true,
      requireType: true,
      validateFormIds: true,
      checkForMissingData: true
    },
    performance: {
      batchSize: 1000,
      enableCaching: true,
      parallelProcessing: false
    }
  };

  if (!configPath) {
    return defaultConfig;
  }

  try {
    // Try to load config from the pipeline directory
    const configFile = path.resolve(process.cwd(), '..', 'pipeline-projects', 'religion', configPath);
    if (fs.existsSync(configFile)) {
      const configContent = fs.readFileSync(configFile, 'utf8');
      const loadedConfig = yaml.load(configContent) as Partial<ReligionConfig>;
      return { ...defaultConfig, ...loadedConfig };
    }
  } catch (error) {
    console.warn(`[RELIGION-DOCS] Could not load config file ${configPath}:`, error);
  }

  return defaultConfig;
}

export function createReligionDocsGenerator(config: DocGenConfig): DocGenerator {
  let stats: ProcessingResult = {};

  return {
    async generate(data: JsonArray, config: DocGenConfig): Promise<JsonArray> {
      console.log('[RELIGION-DOCS] Processing religion data...');

      // Load configuration
      const religionConfig = loadReligionConfig(config.configFile);
      console.log(`[RELIGION-DOCS] Using config: ${religionConfig.name}`);

      // Group properties by their type
      const propertyGroups: Record<string, ReligionProperty> = {};
      
      data.forEach((record: any) => {
        if (record.religionData && record.religionData.name) {
          propertyGroups[record.religionData.name] = {
            name: record.religionData.name,
            values: record.religionData.values || []
          };
        }
      });

      // Get deity names as the primary array
      const deityNames = propertyGroups['WSN_DeityName']?.values || [];
      
      if (deityNames.length === 0) {
        throw new Error('No deity names found in religion data');
      }

      // Create structured deity objects
      let structuredDeities: StructuredDeity[] = deityNames.map((deityName: string, index: number) => {
        const deity: StructuredDeity = {
          name: deityName,
          favoredRaces: []
        };

        // Map other properties by index
        if (propertyGroups['WSN_DivineType']?.values[index]) {
          deity.type = propertyGroups['WSN_DivineType'].values[index];
        }

        if (religionConfig.includeBlessings && propertyGroups['WSN_Blessing']?.values[index]) {
          deity.blessing = propertyGroups['WSN_Blessing'].values[index];
        }

        if (religionConfig.includeBoons) {
          if (propertyGroups['WSN_Boon1']?.values[index]) {
            deity.boon1 = propertyGroups['WSN_Boon1'].values[index];
          }
          if (propertyGroups['WSN_Boon2']?.values[index]) {
            deity.boon2 = propertyGroups['WSN_Boon2'].values[index];
          }
        }

        if (religionConfig.includeTenets && propertyGroups['WSN_Tenet']?.values[index]) {
          deity.tenet = propertyGroups['WSN_Tenet'].values[index];
        }

        // Handle favored races (combine both arrays)
        if (religionConfig.includeFavoredRaces) {
          const favoredRace0 = propertyGroups['WSN_FavoredRace0']?.values[index];
          const favoredRace1 = propertyGroups['WSN_FavoredRace1']?.values[index];
          
          if (favoredRace0 && favoredRace0 !== "0x00000000") {
            const raceName = religionConfig.raceNameMapping[favoredRace0] || "Unknown";
            deity.favoredRaces.push(raceName);
          }
          if (favoredRace1 && favoredRace1 !== "0x00000000") {
            const raceName = religionConfig.raceNameMapping[favoredRace1] || "Unknown";
            deity.favoredRaces.push(raceName);
          }
        }

        return deity;
      });

      // Apply sorting if configured
      if (religionConfig.sortByName) {
        structuredDeities = structuredDeities.sort((a, b) => a.name.localeCompare(b.name));
      }

      // Apply grouping if configured
      if (religionConfig.groupByType) {
        const groupedDeities: Record<string, StructuredDeity[]> = {};
        
        structuredDeities.forEach(deity => {
          const type = deity.type || 'Unknown';
          if (!groupedDeities[type]) {
            groupedDeities[type] = [];
          }
          groupedDeities[type].push(deity);
        });

        // Convert grouped structure to array with type headers
        const result: any[] = [];
        Object.keys(groupedDeities).forEach(type => {
          result.push({
            type: type,
            description: religionConfig.divineTypeDescriptions[type] || '',
            deities: groupedDeities[type]
          });
        });

        structuredDeities = result;
      }

      // Update stats
      const flatDeities = religionConfig.groupByType 
        ? structuredDeities.flatMap((group: any) => group.deities || [])
        : structuredDeities;

      stats = {
        totalDeities: deityNames.length,
        deitiesWithBlessings: flatDeities.filter(d => d.blessing).length,
        deitiesWithBoons: flatDeities.filter(d => d.boon1 || d.boon2).length,
        deitiesWithTenets: flatDeities.filter(d => d.tenet).length,
        deitiesWithFavoredRaces: flatDeities.filter(d => d.favoredRaces.length > 0).length
      };

      console.log(`[RELIGION-DOCS] Processed ${deityNames.length} deities using config: ${religionConfig.name}`);
      
      return structuredDeities;
    },

    getStats: () => stats
  };
} 