import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { loadRecordSet } from "../../utils/loadRecordSet.js";
import { renderMarkdownTemplate } from "../../utils/renderMarkdownTemplate.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_DIR = path.resolve(__dirname);
const RECORD_DIR = path.join(PROJECT_DIR, "records");
const PRIMARY_DIR = path.resolve("primaries"); // shared root-level fallback
const OUTPUT_DIR = path.join(PROJECT_DIR, "output");
const TEMPLATE_DIR = path.join(PROJECT_DIR, "templates");

interface Birthsign {
  name: string;
  group: string;
  edid?: string;
  formid?: string;
  description?: string;
  effects?: string[];
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
          effects: []
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

async function enrichBirthsignsWithSpellData(birthsignGroups: BirthsignGroup[], spelData: any[]): Promise<BirthsignGroup[]> {
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
        
        // Look for powers mentioned in the description
        const powerMatches = spellRecord.decodedData?.DESC?.match(/&lt;([^&]+)&gt;|<([^>]+)>/g);
        if (powerMatches) {
          const powers: string[] = [];
          for (const match of powerMatches) {
            const powerName = match.replace(/&lt;|&gt;|<|>/g, '');
            // Only treat as a power if a matching SPEL record exists with a non-empty DESC
            const powerSpell = spelData.find(record => {
              const fullName = record.decodedData?.FULL;
              const desc = record.decodedData?.DESC;
              return fullName === powerName && desc && desc.trim() !== '';
            });
            if (powerSpell) {
              powers.push(`**${powerName}**: ${powerSpell.decodedData.DESC}`);
            }
            // else: ignore numeric/stat placeholders
          }
          if (powers.length > 0) {
            birthsign.effects = powers;
          } else {
            delete birthsign.effects;
          }
        } else {
          delete birthsign.effects;
        }
      }
    }
  }

  return birthsignGroups;
}

async function generate() {
  // 1. Load MESG records from primaries
  const mesgRecords: any[] = await loadRecordSet<any>(
    "MESG",
    RECORD_DIR,
    PRIMARY_DIR
  );

  // 2. Load SPEL records from primaries
  const spelRecords: any[] = await loadRecordSet<any>(
    "SPEL",
    RECORD_DIR,
    PRIMARY_DIR
  );

  // 3. Parse birthsign structure from the main message
  const { groups, promptMessage, promptNote } = await parseBirthsignStructure(mesgRecords);

  // 4. Enrich birthsigns with spell data
  const enrichedBirthsignGroups = await enrichBirthsignsWithSpellData(groups, spelRecords);

  // 5. Render Markdown
  const markdown = renderMarkdownTemplate(
    path.join(TEMPLATE_DIR, "primary.md"),
    { birthsignGroups: enrichedBirthsignGroups, promptMessage, promptNote } // pass context into the template
  );
  
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUTPUT_DIR, "birthsigns.md"), markdown);

  // 6. Write JSON for web use or ingestion
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