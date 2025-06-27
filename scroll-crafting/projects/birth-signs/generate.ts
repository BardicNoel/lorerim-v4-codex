import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { loadRecordSet } from "../../utils/loadRecordSet.js";
import { renderMarkdownTemplate } from "../../utils/renderMarkdownTemplate.js";
import { findByFormId } from "../../utils/findByFormId.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_DIR = path.resolve(__dirname);
const RECORD_DIR = path.join(PROJECT_DIR, "records");
const PRIMARY_DIR = path.resolve(__dirname, "../../primaries"); // shared root-level fallback
const OUTPUT_DIR = path.join(PROJECT_DIR, "output");
const TEMPLATE_DIR = path.join(PROJECT_DIR, "templates");

interface Birthsign {
  name: string;
  group: string;
  edid?: string;
  formid?: string;
  description?: string;
  powers?: Power[];
}

interface Power {
  name: string;
  description: string;
  magnitude?: number;
  duration?: number;
}

interface BirthsignGroup {
  name: string;
  birthsigns: Birthsign[];
}

async function parseBirthsignStructure(mesgData: any[]): Promise<{groups: BirthsignGroup[], promptMessage: string, promptNote: string}> {
  // Find the main birthsign group message
  const mainMessage = mesgData.find(record => 
    record.decodedData?.EDID === "REQ_Message_Birthsign_Group"
  );

  if (!mainMessage?.decodedData?.DESC) {
    throw new Error("Could not find REQ_Message_Birthsign_Group message");
  }

  const description = mainMessage.decodedData.DESC;
  
  // Parse the description to extract birthsign groups and their members
  const groups: BirthsignGroup[] = [];
  
  // Extract groups from the description
  const groupMatches = description.match(/\[ ([^\]]+) \] ([^\r\n]+)/g);
  
  if (groupMatches) {
    for (const match of groupMatches) {
      const groupMatch = match.match(/\[ ([^\]]+) \] ([^\r\n]+)/);
      if (groupMatch) {
        const groupName = groupMatch[1];
        const birthsignNames = groupMatch[2].split(',').map((name: string) => name.trim());
        
        const birthsigns: Birthsign[] = birthsignNames.map((name: string) => ({
          name,
          group: groupName,
          description: `Sign of the ${name}`,
          powers: []
        }));
        
        groups.push({
          name: groupName,
          birthsigns
        });
      }
    }
  }

  // Format the prompt message
  const lines = description.split('\r\n');
  const formattedLines: string[] = [];
  let note = '';

  for (const line of lines) {
    if (line.startsWith('Note:')) {
      note = line;
    } else if (line.startsWith('[')) {
      formattedLines.push(`**${line}**`);
    } else if (line.trim()) {
      formattedLines.push(line);
    }
  }

  const promptMessage = formattedLines.join('\n\n');

  return { groups, promptMessage, promptNote: note };
}

async function enrichBirthsignsWithSpellData(birthsignGroups: BirthsignGroup[], spelData: any[], mgefData: any[]): Promise<BirthsignGroup[]> {
  for (const group of birthsignGroups) {
    for (const birthsign of group.birthsigns) {
      // Find SPEL record with FULL value matching "Sign of the [BirthsignName]" (case insensitive)
      const spellRecord = spelData.find(record => {
        const fullName = record.decodedData?.FULL;
        if (!fullName) return false;
        const expectedName = `Sign of the ${birthsign.name}`;
        return fullName.toLowerCase() === expectedName.toLowerCase();
      });

      if (spellRecord) {
        birthsign.edid = spellRecord.decodedData?.EDID;
        birthsign.formid = spellRecord.meta?.formId;
        birthsign.description = spellRecord.decodedData?.DESC || birthsign.description;

        // Extract power names from DESC using angle brackets
        const desc = spellRecord.decodedData?.DESC || "";
        const powerMatches = desc.match(/<([^>]+)>|&lt;([^&]+)&gt;/g);
        const powers: Power[] = [];
        
        if (powerMatches) {
          for (const match of powerMatches) {
            const powerName = match.replace(/<|>|&lt;|&gt;/g, '').trim();
            // Skip numeric/stat placeholders
            if (!powerName || !isNaN(parseInt(powerName, 10))) continue;

            // Find related SPEL records by EDID or FULL containing the power name
            const relatedSpells = spelData.filter(record => {
              const edid = record.decodedData?.EDID || '';
              const full = record.decodedData?.FULL || '';
              return edid.toLowerCase().includes(powerName.toLowerCase()) ||
                     full.toLowerCase().includes(powerName.toLowerCase());
            });

            for (const relatedSpell of relatedSpells) {
              // Prefer DESC from the spell
              let spellDesc = relatedSpell.decodedData?.DESC;
              let powerDescription = '';
              let magnitude: number | undefined;
              let duration: number | undefined;

              if (spellDesc && spellDesc.length > 0 && !spellDesc.includes('{') && !spellDesc.includes('}')) {
                powerDescription = spellDesc;
              } else {
                // Fallback: use DNAM from MGEF effects
                const effects = relatedSpell.decodedData?.effects;
                if (effects && effects.length > 0) {
                  for (const effect of effects) {
                    const efid = effect.EFID;
                    if (!efid) continue;
                    
                    // Use findByFormId to look up MGEF record
                    const mgefRecord = findByFormId(mgefData, efid);
                    if (mgefRecord && mgefRecord.decodedData?.DNAM) {
                      powerDescription = mgefRecord.decodedData.DNAM;
                      
                      // Extract magnitude and duration from the SPEL effect data
                      if (effect.EFIT) {
                        magnitude = effect.EFIT.magnitude;
                        duration = effect.EFIT.duration;
                      }
                      break; // Use first effect's description
                    }
                  }
                }
              }

              if (powerDescription) {
                // Replace <mag> and <dur> tags with values if present
                let descWithSubs = powerDescription;
                if (typeof magnitude === 'number') {
                  descWithSubs = descWithSubs.replace(/<mag>|&lt;mag&gt;/gi, `<${magnitude}>`);
                }
                if (typeof duration === 'number') {
                  descWithSubs = descWithSubs.replace(/<dur>|&lt;dur&gt;/gi, `<${duration}>`);
                }
                powers.push({
                  name: powerName,
                  description: descWithSubs,
                  magnitude,
                  duration
                });
                break; // Use first matching spell
              }
            }
          }
        }
        
        if (powers.length > 0) {
          birthsign.powers = powers;
        } else {
          delete birthsign.powers;
        }
      }
    }
  }
  return birthsignGroups;
}

async function generate() {
  console.log("Project directory:", PROJECT_DIR);
  console.log("Record directory:", RECORD_DIR);
  console.log("Primary directory:", PRIMARY_DIR);
  console.log("Primary MESG file:", path.join(PRIMARY_DIR, "mesg.json"));
  console.log("Primary MESG file exists:", fs.existsSync(path.join(PRIMARY_DIR, "mesg.json")));
  
  // 1. Load MESG records from primaries
  const mesgRecords: any[] = await loadRecordSet<any>(
    "MESG",
    RECORD_DIR,
    PRIMARY_DIR
  );

  console.log(`Loaded ${mesgRecords.length} MESG records`);
  
  // Debug: Check for the specific record
  const targetRecord = mesgRecords.find(record => 
    record.decodedData?.EDID === "REQ_Message_Birthsign_Group"
  );
  
  if (targetRecord) {
    console.log("Found target record:", targetRecord.decodedData?.EDID);
  } else {
    console.log("Target record not found. Available EDIDs:");
    mesgRecords.slice(0, 10).forEach(record => {
      console.log(`  - ${record.decodedData?.EDID}`);
    });
  }

  // 2. Load SPEL records from primaries
  const spelRecords: any[] = await loadRecordSet<any>(
    "SPEL",
    RECORD_DIR,
    PRIMARY_DIR
  );

  // 3. Load MGEF records from primaries
  const mgefRecords: any[] = await loadRecordSet<any>(
    "MGEF",
    RECORD_DIR,
    PRIMARY_DIR
  );

  // 4. Parse birthsign structure from the main message
  const { groups, promptMessage, promptNote } = await parseBirthsignStructure(mesgRecords);

  // 5. Enrich birthsigns with spell data
  const enrichedBirthsignGroups = await enrichBirthsignsWithSpellData(groups, spelRecords, mgefRecords);

  // 6. Render Markdown
  const markdown = renderMarkdownTemplate(
    path.join(TEMPLATE_DIR, "primary.md"),
    { birthsignGroups: enrichedBirthsignGroups, promptMessage, promptNote } // pass context into the template
  );
  
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUTPUT_DIR, "birthsigns.md"), markdown);

  // 7. Write JSON for web use or ingestion
  fs.writeFileSync(
    path.join(OUTPUT_DIR, "birthsigns.json"),
    JSON.stringify(enrichedBirthsignGroups, null, 2)
  );

  console.log(`Generated birthsigns.md and birthsigns.json`);
  console.log(`Found ${enrichedBirthsignGroups.length} birthsign groups`);
  enrichedBirthsignGroups.forEach(group => {
    console.log(`  ${group.name}: ${group.birthsigns.length} birthsigns`);
  });
}

generate().catch(console.error); 