import { JsonArray, ProcessingResult } from '../../types/pipeline';
import { DocGenerator, DocGenConfig } from './doc-gen';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { CTDA_FUNCTION_INDICES } from '@lorerim/platform-types'

interface ReligionProperty {
  name: string;
  values: any[];
}

interface StructuredDeity {
  name: string;
  type?: string;
  blessing?: {
    spellId: string;
    spellName?: string;
    effects?: any[] | null;
  };
  boon1?: {
    spellId: string;
    spellName?: string;
    effects?: any[] | null;
  };
  boon2?: {
    spellId: string;
    spellName?: string;
    effects?: any[] | null;
  };
  tenet?: {
    spellId: string;
    spellName?: string;
    header: string;
    description: string;
    effects?: any[] | null;
  };
  favoredRaces: string[];
  description?: string;
  icon?: string;
  worshipRestrictions?: string[];
}

interface SpellEffect {
  magnitude: number;
  area: number;
  duration: number;
  effectName: string;
  effectDescription: string;
  effectType: string;
  targetAttribute?: string;
  keywords?: string[];
}

interface ReligionConfig {
  name: string;
  description: string;
  outputFormat: 'json' | 'markdown' | 'html' | 'both';
  groupByType: boolean;
  sortByName: boolean;
  includeFormIds: boolean;
  includeBlessings: boolean;
  includeBoons: boolean;
  includeTenets: boolean;
  includeFavoredRaces: boolean;
  includeSpellDetails: boolean;
  includeEffectDetails: boolean;
  debug: boolean;
  raceNameMapping: Record<string, string>;
  divineTypeDescriptions: Record<string, string>;
  spellDataFile?: string;
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
  rawQustData: any[];
}

// Updated replacements for effect descriptions
const REPLACEMENTS: Record<string, string> = {
  'Global=WSN_Favor_Global_Fractional3': 'x',
  'Global=WSN_Favor_Global_Fractional2': 'x',
  'Global=WSN_Favor_Global_Fractional': 'x',
  'Global=WSN_Favor_Global': 'x',
  'Global=WSN_Effect_Global_MehrunesExplodes': 'x',
  'Global=WSN_Effect_Global_MehrunesExplodesMax': 'x',
};

function applyReplacements(text: string): string {
  if (!text) return text;
  let result = text;
  for (const [key, value] of Object.entries(REPLACEMENTS)) {
    result = result.replace(new RegExp(key, 'g'), value);
  }
  return result;
}

function toTitleCase(str: string): string {
  if (!str) return str;
  // Special case for 'the HoonDing'
  if (str.toLowerCase() === 'the hoonding' || str === 'the HoonDing') return 'The HoonDing';
  return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1));
}

function getTotemSpells(spellData: Record<string, any>, boonNum: 1 | 2): any[] {
  const pattern = boonNum === 1 ? /^WSN_Misc_Totems_Boon1/ : /^WSN_Misc_Totems_Boon2/;
  return Object.values(spellData).filter((spell: any) => spell.EDID && pattern.test(spell.EDID));
}

// Utility to replace <mag> with magnitude in a description
function replaceMagTag(desc: string, magnitude: number | undefined): string {
  if (desc && desc.includes('<mag>') && magnitude !== undefined) {
    return desc.replace(/<mag>/g, magnitude.toString());
  }
  return desc;
}

// Utility to emphasize any remaining <...> tags (not <mag>)
function emphasizeAngleTags(desc: string): string {
  // Replace <...> with ***...***, but skip <mag>
  return desc.replace(/<(?!mag)([^>]+)>/gi, (_match, p1) => `***${p1.trim()}***`);
}

function debugLogZeroOrUndefined(
  context: string,
  deityName: string,
  effectName: string,
  value: any,
  config?: ReligionConfig
) {
  if (config?.debug && (value === undefined || value === null || value === '')) {
    // eslint-disable-next-line no-console
    console.log(`[DEBUG][${context}] Deity: ${deityName}, Effect: ${effectName}, Value:`, value);
  }
}

function formatBoonSection(
  boon: any,
  deityName: string,
  spellData: Record<string, any>,
  isOldWays: boolean,
  boonNum: 1 | 2,
  config: ReligionConfig
): string {
  if (!boon || !Array.isArray(boon.effects) || boon.effects.length === 0) return '';
  let out = `**${boon.spellName || 'Boon'}**\n`;
  // Main effect (first MGEF)
  const mainEffect = boon.effects[0];
  if (mainEffect) {
    let desc = applyReplacements(mainEffect.effectDescription || '');
    desc = replaceMagTag(desc, mainEffect.magnitude);
    desc = emphasizeAngleTags(desc);
    debugLogZeroOrUndefined('Boon', deityName, mainEffect.effectName, mainEffect.magnitude, config);
    debugLogZeroOrUndefined('Boon', deityName, mainEffect.effectName, desc, config);
    out += `- ${mainEffect.effectName}: ${desc}\n`;
  }
  // Additional effects as Notes
  if (boon.effects.length > 1) {
    out += '- Notes:\n';
    for (let i = 1; i < boon.effects.length; i++) {
      const eff = boon.effects[i];
      let desc = applyReplacements(eff.effectDescription || '');
      desc = replaceMagTag(desc, eff.magnitude);
      desc = emphasizeAngleTags(desc);
      debugLogZeroOrUndefined('Boon', deityName, eff.effectName, eff.magnitude, config);
      debugLogZeroOrUndefined('Boon', deityName, eff.effectName, desc, config);
      out += `  - ${eff.effectName}: ${desc}\n`;
    }
  }
  // Special handling for The Old Ways totems
  if (isOldWays) {
    const totems = getTotemSpells(spellData, boonNum);
    if (totems.length > 0) {
      out += '- Totems:\n';
      totems.forEach((totem: any) => {
        const totemEffect = totem.effects && totem.effects[0];
        let totemDesc = totemEffect?.MGEF?.DNAM ? applyReplacements(totemEffect.MGEF.DNAM) : '';
        totemDesc = replaceMagTag(totemDesc, totemEffect?.EFIT?.magnitude);
        totemDesc = emphasizeAngleTags(totemDesc);
        debugLogZeroOrUndefined(
          'Totem',
          deityName,
          totemEffect?.MGEF?.FULL || totemEffect?.EDID || 'Unknown Totem',
          totemEffect?.EFIT?.magnitude,
          config
        );
        debugLogZeroOrUndefined(
          'Totem',
          deityName,
          totemEffect?.MGEF?.FULL || totemEffect?.EDID || 'Unknown Totem',
          totemDesc,
          config
        );
        out += `  - ${totem.FULL || totem.EDID}: ${totemDesc}\n`;
      });
    }
  }
  out += '\n';
  return out;
}

function loadReligionConfig(configPath?: string, debug: boolean = false): ReligionConfig {
  const defaultConfig: ReligionConfig = {
    name: 'Default Religion Config',
    description: 'Default configuration for religion documentation generation',
    outputFormat: 'json',
    groupByType: true,
    sortByName: true,
    includeFormIds: false,
    includeBlessings: true,
    includeBoons: true,
    includeTenets: true,
    includeFavoredRaces: true,
    includeSpellDetails: true,
    includeEffectDetails: true,
    debug: debug,
    raceNameMapping: {
      '0x00013743': 'Altmer',
      '0x00013744': 'Argonian',
      '0x00013745': 'Bosmer',
      '0x00013746': 'Breton',
      '0x00013747': 'Dunmer',
      '0x00013748': 'Imperial',
      '0x00013749': 'Khajiit',
      '0x0001374A': 'Nord',
      '0x0001374B': 'Orc',
      '0x0001374C': 'Redguard',
      '0x0008883D': 'Reachman',
    },
    divineTypeDescriptions: {
      'Aedra': 'The Aedra are the original spirits who gave up their immortality to create the mortal world.',
      'Daedra': 'The Daedra are powerful spirits who refused to participate in the creation of the mortal world.',
      'Tribunal': 'The Tribunal are the living gods of Morrowind, worshipped by the Dunmer.',
      'Old Ways': 'The Old Ways represent the ancient traditions and totemic worship of the Nords.',
      'Reachman': 'The Reachmen follow the Old Ways with their own unique traditions.',
    },
    markdownTemplate: {
      includeHeader: true,
      includeTableOfContents: true,
      includeTypeSections: true,
      includeEffectDetails: true,
      includeFormIdReferences: false,
    },
    htmlTemplate: {
      includeCSS: true,
      includeNavigation: true,
      includeSearch: true,
      responsiveDesign: true,
    },
    effectResolution: {
      resolveSpellNames: true,
      resolveEffectDescriptions: true,
      includeMagnitude: true,
      includeDuration: true,
    },
    validation: {
      requireName: true,
      requireType: true,
      validateFormIds: false,
      checkForMissingData: true,
    },
    performance: {
      batchSize: 100,
      enableCaching: true,
      parallelProcessing: false,
    },
    rawQustData: [],
  };

  if (!configPath) {
    return defaultConfig;
  }

  try {
    const configFile = path.isAbsolute(configPath)
      ? configPath
      : path.resolve(process.cwd(), configPath);
    const configContent = fs.readFileSync(configFile, 'utf8');
    const loadedConfig = yaml.load(configContent) as Partial<ReligionConfig>;
    // Attach the config file directory for later use
    (loadedConfig as any).__configDir = path.dirname(configFile);
    // Debug: Log config file resolution
    if (debug) {
      console.log(`[RELIGION-DOCS][DEBUG] Loading CONFIG from path: ${configFile}`);
    }
    // Load QUST data if specified
    const loadedConfigAny = loadedConfig as any;
    if (loadedConfigAny.qustDataFile && !loadedConfigAny.rawQustData) {
      const qustPath = path.isAbsolute(loadedConfigAny.qustDataFile)
        ? loadedConfigAny.qustDataFile
        : path.resolve(process.cwd(), loadedConfigAny.qustDataFile);
      if (debug) {
        console.log(`[RELIGION-DOCS][DEBUG] Loading QUST from path: ${qustPath}`);
      }
      if (fs.existsSync(qustPath)) {
        loadedConfigAny.rawQustData = JSON.parse(fs.readFileSync(qustPath, 'utf8'));
      } else {
        if (debug) {
          console.log(`[RELIGION-DOCS][DEBUG] QUST file not found at path: ${qustPath}`);
        }
      }
    }
    return { ...defaultConfig, ...loadedConfig };
  } catch (error) {
    console.warn(`[RELIGION-DOCS] Could not load config file ${configPath}:`, error);
  }

  return defaultConfig;
}

function loadSpellData(spellDataFile?: string, configDir?: string, debug: boolean = false): Record<string, any> {
  if (!spellDataFile) {
    if (debug) {
      console.log(`[RELIGION-DOCS][DEBUG] No spell data file specified`);
    }
    return {};
  }

  try {
    let spellFile = spellDataFile;
    if (debug) {
      console.log(`[RELIGION-DOCS][DEBUG] Original spell file path: ${spellDataFile}`);
      console.log(`[RELIGION-DOCS][DEBUG] Is absolute path: ${path.isAbsolute(spellDataFile)}`);
    }
    if (!path.isAbsolute(spellDataFile)) {
      spellFile = path.resolve(process.cwd(), spellDataFile);
      if (debug) {
        console.log(`[RELIGION-DOCS][DEBUG] Resolved relative path to: ${spellFile}`);
      }
    }
    if (debug) {
      console.log(`[RELIGION-DOCS][DEBUG] Final spell file path: ${spellFile}`);
      console.log(`[RELIGION-DOCS][DEBUG] File exists: ${fs.existsSync(spellFile)}`);
    }
    if (fs.existsSync(spellFile)) {
      const spellContent = fs.readFileSync(spellFile, 'utf8');
      const spellData = JSON.parse(spellContent);


      // Create a lookup map by FormID
      const spellMap: Record<string, any> = {};
      spellData.forEach((spell: any) => {
        if (spell.meta?.globalFormId) {
          spellMap[spell.meta.globalFormId] = spell;
        }
      });

      if (debug) {
        console.log(`[RELIGION-DOCS][DEBUG] Loaded ${spellData.length} spell records, mapped ${Object.keys(spellMap).length} by FormID`);
      }

      return spellMap;
    } else {
      if (debug) {
        console.log(`[RELIGION-DOCS][DEBUG] SPELL file not found at path: ${spellFile}`);
      }
    }
  } catch (error) {
    console.warn(`[RELIGION-DOCS] Could not load spell data file ${spellDataFile}:`, error);
  }

  return {};
}

function extractSpellEffects(spell: any): SpellEffect[] {
  if (!spell?.effects || !Array.isArray(spell.effects)) {
    return [];
  }

  return spell.effects.map((effect: any) => {
    const spellEffect: SpellEffect = {
      magnitude: effect.EFIT?.magnitude || 0,
    area: effect.EFIT?.area || 0,
      duration: effect.EFIT?.duration || 0,
      effectName: effect.MGEF?.FULL || effect.MGEF?.EDID || 'Unknown Effect',
      effectDescription: effect.MGEF?.DNAM || '',
      effectType: effect.MGEF?.DATA?.effectType?.toString() || 'Unknown',
      targetAttribute: effect.MGEF?.DATA?.primaryAV?.name || null,
      keywords: effect.MGEF?.KWDA || [],
    };
    return spellEffect;
  });
}

function cleanUndefinedValues(obj: any): any {
  if (obj === undefined) {
    return null;
  }
  if (obj === null) {
    return null;
  }
  if (typeof obj === 'object' && !Array.isArray(obj)) {
    const cleaned: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        cleaned[key] = cleanUndefinedValues(value);
      }
    }
    return cleaned;
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => cleanUndefinedValues(item));
  }
  return obj;
}

function findAltarBlessingSpellByFormId(
  formId: string,
  spellData: Record<string, any>
): any | null {
  if (!formId || typeof formId !== 'string') {
    console.log('[ALTAR BLESSING DEBUG] Invalid or missing FormID', formId);
    return null;
  }
  for (const spell of Object.values(spellData)) {
    if (spell.meta?.globalFormId?.toLowerCase() === formId.toLowerCase()) {
      // Debug output for altar blessing spell
      const firstEffect = spell.effects && spell.effects[0];
      const mgef = firstEffect?.MGEF;
      return spell;
    }
  }
  // Debug if not found
  console.log('[ALTAR BLESSING DEBUG] Not found for FormID', formId);
  return null;
}

function extractWorshipRestrictions(
  ctdaArray: any[],
  raceNameMapping: Record<string, string>
): string[] {
  if (!Array.isArray(ctdaArray)) return [];
  const restrictions: string[] = [];
  for (const ctda of ctdaArray) {
    const fnIndex = ctda.function?.functionIndex;
    const fnName = CTDA_FUNCTION_INDICES[fnIndex] || ctda.function?.functionName;
    switch (fnIndex) {
      case 43: // SameRace
      case 69: // GetIsRace
      case 130: // GetPCIsRace
        {
          const raceFormId = ctda.reference || ctda.param1;
          const raceName = raceNameMapping[raceFormId] || raceFormId;
          restrictions.push(`Requires race: ${raceName}`);
        }
        break;
      case 56: // GetQuestRunning
        {
          const questFormId = ctda.reference || ctda.param1;
          restrictions.push(`Requires quest ${questFormId} to be running`);
        }
        break;
      case 58: // GetStage
      case 59: // GetStageDone
        {
          const questFormId = ctda.reference || ctda.param1;
          restrictions.push(`Requires quest ${questFormId} at stage ${ctda.comparisonValue}`);
        }
        break;
      case 74: // GetGlobalValue
        restrictions.push(`Requires global ${ctda.param1} = ${ctda.comparisonValue}`);
        break;
      default:
        if (fnName) {
          restrictions.push(
            `Restriction: ${fnName} (params: ref=${ctda.reference}, param1=${ctda.param1}, value=${ctda.comparisonValue})`
          );
        }
        break;
    }
  }
  return restrictions;
}

function generateMarkdown(data: any[], config: ReligionConfig): string {
  let markdown = '';

  // Header
  markdown += `# The Religions of Skyrim\n\n`;
  markdown += `# Altar Blessings\n\n`;
  markdown += `Religion is polytheistic in Skyrim, your character is free to receive blessings from deities other than the one followed\n\n`;

  // Altar Blessings List (simple list at the top)
  const allDeities: any[] = config.groupByType ? data.flatMap((group: any) => group.deities) : data;
  
  // Create sorted list of altar blessings
  const altarBlessings: string[] = [];
  allDeities.forEach((deity: any) => {
    const deityName = toTitleCase(deity.name);
    if (
      deity.blessing &&
      deity.blessing.spellName &&
      deity.blessing.effects &&
      deity.blessing.effects[0]
    ) {
      const effect = deity.blessing.effects[0];
      let desc = applyReplacements(effect.effectDescription || '');
      desc = replaceMagTag(desc, effect.magnitude);
      desc = emphasizeAngleTags(desc);
      debugLogZeroOrUndefined('AltarBlessing', deityName, effect.effectName, effect.magnitude, config);
      debugLogZeroOrUndefined('AltarBlessing', deityName, effect.effectName, desc, config);
      altarBlessings.push(`- *Blessing of ${deityName}*: ${desc}`);
    }
  });
  
  // Sort alphabetically and add to markdown
  altarBlessings.sort().forEach(blessing => {
    markdown += `${blessing}\n`;
  });
  markdown += '\n';

  // Divine Type Section
  if (config.groupByType) {
    data.forEach((group: any) => {
      markdown += `# ${group.type}\n\n`;
      group.deities.forEach((deity: any) => {
        const deityName = toTitleCase(deity.name);
        markdown += `## ${deityName}\n\n`;
        // Altar Blessing for each deity
        if (
          deity.blessing &&
          deity.blessing.spellName &&
          deity.blessing.effects &&
          deity.blessing.effects[0]
        ) {
          const effect = deity.blessing.effects[0];
          let desc = applyReplacements(effect.effectDescription || '');
          desc = replaceMagTag(desc, effect.magnitude);
          desc = emphasizeAngleTags(desc);
          debugLogZeroOrUndefined('AltarBlessing', deityName, effect.effectName, effect.magnitude, config);
          debugLogZeroOrUndefined('AltarBlessing', deityName, effect.effectName, desc, config);
          markdown += `*blessing of ${deityName.toLowerCase()}*: ${desc}\n`;
        }
        // Tenets
        if (config.includeTenets && deity.tenet) {
          markdown += `**${deity.tenet.header}**\n`;
          if (deity.tenet.description) {
            let tenetDesc = applyReplacements(deity.tenet.description);
            tenetDesc = emphasizeAngleTags(tenetDesc);
            debugLogZeroOrUndefined('Tenet', deityName, 'description', tenetDesc, config);
            markdown += `${tenetDesc}\n\n`;
          }
        }
        // Worship Restrictions
        if (deity.worshipRestrictions && deity.worshipRestrictions.length > 0) {
          markdown += `**Worship Restrictions**\n`;
          deity.worshipRestrictions.forEach((r: string) => {
            markdown += `- ${r}\n`;
          });
          markdown += '\n';
        }
        // Follower (Boon 1)
        if (config.includeBoons && deity.boon1) {
          markdown += formatBoonSection(
            deity.boon1,
            deityName,
            {}, // spellData not needed, already resolved
            deityName === 'The Animal Gods',
            1,
            config
          );
        }
        // Devotee (Boon 2)
        if (config.includeBoons && deity.boon2) {
          markdown += formatBoonSection(
            deity.boon2,
            deityName,
            {}, // spellData not needed, already resolved
            deityName === 'The Animal Gods',
            2,
            config
          );
        }
        markdown += '\n';
      });
    });
  } else {
    data.forEach((deity: any) => {
      const deityName = toTitleCase(deity.name);
      markdown += `# ${deityName}\n\n`;
      // Altar Blessing for each deity
      if (
        deity.blessing &&
        deity.blessing.spellName &&
        deity.blessing.effects &&
        deity.blessing.effects[0]
      ) {
        const effect = deity.blessing.effects[0];
        let desc = applyReplacements(effect.effectDescription || '');
        desc = replaceMagTag(desc, effect.magnitude);
        desc = emphasizeAngleTags(desc);
        debugLogZeroOrUndefined('AltarBlessing', deityName, effect.effectName, effect.magnitude, config);
        debugLogZeroOrUndefined('AltarBlessing', deityName, effect.effectName, desc, config);
        markdown += `*blessing of ${deityName.toLowerCase()}*: ${desc}\n`;
      }
      // Tenets
      if (config.includeTenets && deity.tenet) {
        markdown += `**${deity.tenet.header}**\n`;
        if (deity.tenet.description) {
          let tenetDesc = applyReplacements(deity.tenet.description);
          tenetDesc = emphasizeAngleTags(tenetDesc);
          debugLogZeroOrUndefined('Tenet', deityName, 'description', tenetDesc, config);
          markdown += `${tenetDesc}\n\n`;
        }
      }
      // Worship Restrictions
      if (deity.worshipRestrictions && deity.worshipRestrictions.length > 0) {
        markdown += `**Worship Restrictions**\n`;
        deity.worshipRestrictions.forEach((r: string) => {
          markdown += `- ${r}\n`;
        });
        markdown += '\n';
      }
      // Follower (Boon 1)
      if (config.includeBoons && deity.boon1) {
        markdown += formatBoonSection(
          deity.boon1,
          deityName,
          {}, // spellData not needed, already resolved
          deityName === 'The Animal Gods',
          1,
          config
        );
      }
      // Devotee (Boon 2)
      if (config.includeBoons && deity.boon2) {
        markdown += formatBoonSection(
          deity.boon2,
          deityName,
          {}, // spellData not needed, already resolved
          deityName === 'The Animal Gods',
          2,
          config
        );
      }
      markdown += '\n';
    });
  }

  return markdown;
}

function findAltarBlessingEffect(spell: any): any | null {
  if (!spell?.effects || !Array.isArray(spell.effects)) {
    return null;
  }
  
  // Look for an effect that contains "AltarBlessing" in its EDID
  for (const effect of spell.effects) {
    const effectEdid = effect.MGEF?.EDID || '';
    
    // Check EDID for AltarBlessing pattern
    if (effectEdid.toLowerCase().includes('altarblessing')) {
      return effect;
    }
  }
  
  // If no AltarBlessing effect found, return the first effect as fallback
  return spell.effects[0] || null;
}

export function createReligionDocsGenerator(config: DocGenConfig): DocGenerator {
  let stats: ProcessingResult = {};

  return {
    async generate(data: JsonArray, config: DocGenConfig): Promise<JsonArray> {
      console.log('[RELIGION-DOCS] Processing religion data...');

      // Load configuration
      const religionConfig = loadReligionConfig(config.configFile, true);
      console.log(`[RELIGION-DOCS] Using config: ${religionConfig.name}`);

      // Load spell data if configured
      const spellData = loadSpellData(
        religionConfig.spellDataFile,
        (religionConfig as any).__configDir,
        religionConfig.debug
      );
      console.log(`[RELIGION-DOCS] Loaded ${Object.keys(spellData).length} spell records`);

      // Build property arrays by name from rawQustData
      const propertyArrays: Record<string, any[]> = {};
      (religionConfig.rawQustData || []).forEach((record: any) => {
        if (record.religionData && record.religionData.name) {
          propertyArrays[record.religionData.name] = record.religionData.values || [];
        }
      });

      if (religionConfig.debug) {
        console.log(`[RELIGION-DOCS][DEBUG] QUST data loaded: ${Object.keys(propertyArrays).length} property arrays`);
      }

      // Determine the number of deities (length of WSN_DeityName)
      const deityCount = propertyArrays['WSN_DeityName']?.length || 0;
      if (deityCount === 0) {
        throw new Error('No deity names found in religion data');
      }

      // Build deities by index
      let structuredDeities: StructuredDeity[] = [];
      for (let i = 0; i < deityCount; i++) {
        const name = propertyArrays['WSN_DeityName']?.[i] || '';
        const type = propertyArrays['WSN_DivineType']?.[i] || '';
        const blessingSpellId = propertyArrays['WSN_Blessing']?.[i];
        const blessingSpell = spellData[blessingSpellId];
        
        // Simple logging for altar blessing selection
        if (blessingSpellId && blessingSpell) {
          const altarBlessingEffect = findAltarBlessingEffect(blessingSpell);
          if (altarBlessingEffect) {
            const effectEdid = altarBlessingEffect.MGEF?.EDID || 'Unknown';
            console.log(`[RELIGION-DOCS] ${name}: Altar blessing MGEF = ${effectEdid}`);
            
            // Debug for Tribunal deities to see what effects are available
            if (type === 'Tribunal' && blessingSpell.effects) {
              console.log(`[RELIGION-DOCS] ${name}: Spell has ${blessingSpell.effects.length} effects:`);
              blessingSpell.effects.forEach((effect: any, index: number) => {
                const effectName = effect.MGEF?.FULL || effect.MGEF?.EDID || 'Unknown';
                console.log(`[RELIGION-DOCS] ${name}: Effect ${index}: ${effectName}`);
              });
            }
          } else {
            console.error(`[RELIGION-DOCS] ERROR: ${name}: No altar blessing effect found in spell ${blessingSpellId}`);
          }
        }

        const boon1SpellId = propertyArrays['WSN_Boon1']?.[i];
        const boon1Spell = spellData[boon1SpellId];
        const boon2SpellId = propertyArrays['WSN_Boon2']?.[i];
        const boon2Spell = spellData[boon2SpellId];
        const tenetSpellId = propertyArrays['WSN_Tenet']?.[i];
        const tenetSpell = spellData[tenetSpellId];
        const favoredRace0 = propertyArrays['WSN_FavoredRace0']?.[i];
        const favoredRace1 = propertyArrays['WSN_FavoredRace1']?.[i];

        // Build tenet object if possible
        let tenet = undefined;
        if (tenetSpell && tenetSpell.effects && tenetSpell.effects.length > 0) {
          const firstEffect = tenetSpell.effects[0];
          tenet = {
            spellId: tenetSpellId,
            spellName: tenetSpell.FULL || tenetSpell.EDID || 'Unknown Tenet',
            header: firstEffect.MGEF?.FULL || 'Unknown Tenet',
            description: firstEffect.MGEF?.DNAM || '',
            effects: religionConfig.includeEffectDetails ? extractSpellEffects(tenetSpell) : null,
          };
        } else if (tenetSpellId) {
          tenet = {
            spellId: tenetSpellId,
            spellName: 'Unknown Tenet',
            header: 'Unknown Tenet',
            description: 'Tenet information not found',
            effects: null,
          };
        }

        // Build favored races array
        const favoredRaces: string[] = [];
        if (religionConfig.includeFavoredRaces) {
          if (favoredRace0 && favoredRace0 !== '0x00000000') {
            const raceName = religionConfig.raceNameMapping[favoredRace0] || 'Unknown';
            favoredRaces.push(raceName);
          }
          if (favoredRace1 && favoredRace1 !== '0x00000000') {
            const raceName = religionConfig.raceNameMapping[favoredRace1] || 'Unknown';
            favoredRaces.push(raceName);
          }
        }

        const failSpellId = propertyArrays['WSN_WorshipFail']?.[i];
        const failSpell = spellData[failSpellId];
        let worshipRestrictions: string[] = [];
        if (failSpell && failSpell.effects && failSpell.effects[0]?.MGEF?.CTDA) {
          worshipRestrictions = extractWorshipRestrictions(
            failSpell.effects[0].MGEF.CTDA,
            religionConfig.raceNameMapping
          );
        } else {
          console.log(`[DEBUG][WorshipRestriction] No fail spell found for deity:`, name);
        }

        structuredDeities.push({
          name,
          type,
          blessing: blessingSpellId
            ? {
                spellId: blessingSpellId,
                spellName: blessingSpell?.FULL || blessingSpell?.EDID || 'Unknown Blessing',
                effects: religionConfig.includeEffectDetails
                  ? (() => {
                      const altarBlessingEffect = findAltarBlessingEffect(blessingSpell);
                      if (altarBlessingEffect) {
                        return [{
                          magnitude: altarBlessingEffect.EFIT?.magnitude || 0,
                          area: altarBlessingEffect.EFIT?.area || 0,
                          duration: altarBlessingEffect.EFIT?.duration || 0,
                          effectName: altarBlessingEffect.MGEF?.FULL || altarBlessingEffect.MGEF?.EDID || 'Unknown Effect',
                          effectDescription: altarBlessingEffect.MGEF?.DNAM || '',
                          effectType: altarBlessingEffect.MGEF?.DATA?.effectType?.toString() || 'Unknown',
                          targetAttribute: altarBlessingEffect.MGEF?.DATA?.primaryAV?.name || null,
                          keywords: altarBlessingEffect.MGEF?.KWDA || [],
                        }];
                      }
                      return [];
                    })()
                  : null,
              }
            : undefined,
          boon1: boon1SpellId
            ? {
                spellId: boon1SpellId,
                spellName: boon1Spell?.FULL || boon1Spell?.EDID || 'Unknown Boon 1',
                effects: religionConfig.includeEffectDetails
                  ? extractSpellEffects(boon1Spell)
                  : null,
              }
            : undefined,
          boon2: boon2SpellId
            ? {
                spellId: boon2SpellId,
                spellName: boon2Spell?.FULL || boon2Spell?.EDID || 'Unknown Boon 2',
                effects: religionConfig.includeEffectDetails
                  ? extractSpellEffects(boon2Spell)
                  : null,
              }
            : undefined,
          tenet,
          favoredRaces,
          worshipRestrictions,
        });
      }

      // Apply sorting if configured
      if (religionConfig.sortByName) {
        structuredDeities = structuredDeities.sort((a, b) => a.name.localeCompare(b.name));
      }

      // Apply grouping if configured
      if (religionConfig.groupByType) {
        const groupedDeities: Record<string, StructuredDeity[]> = {};

        structuredDeities.forEach((deity) => {
          const type = deity.type || 'Unknown';
          if (!groupedDeities[type]) {
            groupedDeities[type] = [];
          }
          groupedDeities[type].push(deity);
        });

        // Convert grouped structure to array with type headers
        const result: any[] = [];
        Object.keys(groupedDeities).forEach((type) => {
          result.push({
            type: type,
            description: religionConfig.divineTypeDescriptions[type] || '',
            deities: groupedDeities[type],
          });
        });

        structuredDeities = result;
      }

      // Clean undefined values
      structuredDeities = cleanUndefinedValues(structuredDeities);

      // Generate additional output formats if requested
      if (religionConfig.outputFormat === 'markdown' || religionConfig.outputFormat === 'both') {
        const markdownOutput = generateMarkdown(structuredDeities, religionConfig);
        const markdownPath = path.resolve(
          process.cwd(),
          '..',
          'pipeline-projects',
          'religion',
          'wintersun-religion-docs.md'
        );
        fs.writeFileSync(markdownPath, markdownOutput, 'utf8');
        console.log(`[RELIGION-DOCS] Generated Markdown documentation: ${markdownPath}`);
      }

      // Update stats
      const flatDeities = religionConfig.groupByType
        ? structuredDeities.flatMap((group: any) => group.deities || [])
        : structuredDeities;

      stats = {
        totalDeities: deityCount,
        deitiesWithBlessings: flatDeities.filter((d) => d.blessing).length,
        deitiesWithBoons: flatDeities.filter((d) => d.boon1 || d.boon2).length,
        deitiesWithTenets: flatDeities.filter((d) => d.tenet && d.tenet.description).length,
        deitiesWithFavoredRaces: flatDeities.filter((d) => d.favoredRaces.length > 0).length,
        spellsResolved: Object.keys(spellData).length,
        effectsExtracted: flatDeities.reduce((total, d) => {
          return (
            total +
            (d.blessing?.effects?.length || 0) +
            (d.boon1?.effects?.length || 0) +
            (d.boon2?.effects?.length || 0) +
            (d.tenet?.effects?.length || 0)
          );
        }, 0),
      };

      console.log(
        `[RELIGION-DOCS] Processed ${deityCount} deities using config: ${religionConfig.name}`
      );
      console.log(`[RELIGION-DOCS] Resolved ${Object.keys(spellData).length} spell records`);

      return structuredDeities;
    },

    getStats: () => stats,
  };
}

