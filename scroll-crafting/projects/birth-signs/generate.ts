import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { loadRecordSet } from "../../utils/loadRecordSet.js";
import { renderMarkdownTemplate } from "../../utils/renderMarkdownTemplate.js";
import { findByFormId } from "../../utils/findByFormId.js";
import { MgefRecordFromSchema } from "../../types/mgefSchema.js";
import { SpelRecordFromSchema } from "../../types/spelSchema.js";
import { MesgRecordFromSchema } from "../../types/mesgSchema.js";

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

async function parseBirthsignStructure(
  mesgData: MesgRecordFromSchema[]
): Promise<{
  groups: BirthsignGroup[];
  promptMessage: string;
  promptNote: string;
}> {
  // Find the main birthsign group message
  const mainMessage = mesgData.find(
    (record) => record.data.EDID === "REQ_Message_Birthsign_Group"
  );

  if (!mainMessage?.data.DESC) {
    throw new Error("Could not find REQ_Message_Birthsign_Group message");
  }

  const description = mainMessage.data.DESC;

  // Parse the description to extract birthsign groups and their members
  const groups: BirthsignGroup[] = [];

  // Extract groups from the description
  const groupMatches = description.match(/\[ ([^\]]+) \] ([^\r\n]+)/g);

  if (groupMatches) {
    for (const match of groupMatches) {
      const groupMatch = match.match(/\[ ([^\]]+) \] ([^\r\n]+)/);
      if (groupMatch) {
        const groupName = groupMatch[1];
        const birthsignNames = groupMatch[2]
          .split(",")
          .map((name: string) => name.trim());

        const birthsigns: Birthsign[] = birthsignNames.map((name: string) => ({
          name,
          group: groupName,
          description: `Sign of the ${name}`,
          powers: [],
        }));

        groups.push({
          name: groupName,
          birthsigns,
        });
      }
    }
  }

  // Format the prompt message
  const lines = description.split("\r\n");
  const formattedLines: string[] = [];
  let note = "";

  for (const line of lines) {
    if (line.startsWith("Note:")) {
      note = line;
    } else if (line.startsWith("[")) {
      formattedLines.push(`**${line}**`);
    } else if (line.trim()) {
      formattedLines.push(line);
    }
  }

  const promptMessage = formattedLines.join("\n\n");

  return { groups, promptMessage, promptNote: note };
}

async function enrichBirthsignsWithSpellData(
  birthsignGroups: BirthsignGroup[],
  spelData: SpelRecordFromSchema[],
  mgefData: MgefRecordFromSchema[]
): Promise<BirthsignGroup[]> {
  for (const group of birthsignGroups) {
    for (const birthsign of group.birthsigns) {
      // Find SPEL record with FULL value matching "Sign of the [BirthsignName]" (case insensitive)
      const spellRecord = spelData.find((record) => {
        const fullName = record.data.FULL;
        if (!fullName) return false;
        const expectedName = `Sign of the ${birthsign.name}`;
        return fullName.toLowerCase() === expectedName.toLowerCase();
      });

      if (spellRecord) {
        birthsign.edid = spellRecord.data.EDID;
        birthsign.formid = spellRecord.meta.formId;
        birthsign.description = spellRecord.data.DESC || birthsign.description;

        // Extract power names from DESC using angle brackets
        const desc = spellRecord.data.DESC || "";
        const powerMatches = desc.match(/<([^>]+)>|&lt;([^&]+)&gt;/g);
        const powers: Power[] = [];

        if (powerMatches) {
          for (const match of powerMatches) {
            const powerName = match.replace(/<|>|&lt;|&gt;/g, "").trim();
            // Skip numeric/stat placeholders
            if (!powerName || !isNaN(parseInt(powerName, 10))) continue;

            // Find related SPEL records by EDID or FULL containing the power name
            const relatedSpells = spelData.filter((record) => {
              const edid = record.data.EDID || "";
              const full = record.data.FULL || "";
              return (
                edid.toLowerCase().includes(powerName.toLowerCase()) ||
                full.toLowerCase().includes(powerName.toLowerCase())
              );
            });

            for (const relatedSpell of relatedSpells) {
              // Prefer DESC from the spell
              let spellDesc = relatedSpell.data.DESC;
              let powerDescription = "";
              let magnitude: number | undefined;
              let duration: number | undefined;

              if (
                spellDesc &&
                spellDesc.length > 0 &&
                !spellDesc.includes("{") &&
                !spellDesc.includes("}")
              ) {
                powerDescription = spellDesc;
              } else {
                // Fallback: use DNAM from MGEF effects
                const effects = relatedSpell.data.effects;
                if (effects && effects.length > 0) {
                  for (const effect of effects) {
                    const efid = effect.EFID;
                    if (!efid) continue;

                    // Use findByFormId to look up MGEF record
                    const mgefRecord = findByFormId(mgefData, efid);
                    if (mgefRecord && mgefRecord.data.DNAM) {
                      powerDescription = mgefRecord.data.DNAM;

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
                if (typeof magnitude === "number") {
                  descWithSubs = descWithSubs.replace(
                    /<mag>|&lt;mag&gt;/gi,
                    `<${magnitude}>`
                  );
                }
                if (typeof duration === "number") {
                  descWithSubs = descWithSubs.replace(
                    /<dur>|&lt;dur&gt;/gi,
                    `<${duration}>`
                  );
                }
                powers.push({
                  name: powerName,
                  description: descWithSubs,
                  magnitude,
                  duration,
                });
              }
            }
          }
        }

        birthsign.powers = powers;
      }
    }
  }

  return birthsignGroups;
}

async function generate() {
  // Create output directory if it doesn't exist
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Log paths for debugging
  console.log("Primary MESG file:", path.join(PRIMARY_DIR, "mesg.json"));
  console.log(
    "Primary MESG file exists:",
    fs.existsSync(path.join(PRIMARY_DIR, "mesg.json"))
  );

  // 1. Load MESG records from primaries
  const mesgRecords = await loadRecordSet<MesgRecordFromSchema>(
    "MESG",
    RECORD_DIR,
    PRIMARY_DIR
  );

  console.log(`Loaded ${mesgRecords.length} MESG records`);

  // Debug: Check if we found the target record
  const targetRecord = mesgRecords.find(
    (record) => record.data.EDID === "REQ_Message_Birthsign_Group"
  );
  console.log("Found target record:", targetRecord?.data.EDID);

  // Debug: Print first 10 record EDIDs
  console.log("First 10 record EDIDs:");
  mesgRecords.slice(0, 10).forEach((record) => {
    console.log(`  - ${record.data.EDID}`);
  });

  // 2. Load SPEL records from primaries
  console.log("📂 Loading spell records...");
  const spelRecords = await loadRecordSet<SpelRecordFromSchema>(
    "SPEL",
    RECORD_DIR,
    PRIMARY_DIR
  );
  console.log(`   Loaded ${spelRecords.length} spell records`);

  // 3. Load MGEF records from primaries
  console.log("📂 Loading magic effect records...");
  const mgefRecords = await loadRecordSet<MgefRecordFromSchema>(
    "MGEF",
    RECORD_DIR,
    PRIMARY_DIR
  );
  console.log(`   Loaded ${mgefRecords.length} magic effect records`);

  // 4. Parse birthsign structure from the main message
  const { groups, promptMessage, promptNote } =
    await parseBirthsignStructure(mesgRecords);

  // 5. Enrich birthsigns with spell data
  const enrichedBirthsignGroups = await enrichBirthsignsWithSpellData(
    groups,
    spelRecords,
    mgefRecords
  );

  // 6. Render markdown template
  const markdown = await renderMarkdownTemplate(
    path.join(TEMPLATE_DIR, "birthsigns.md"),
    {
      groups: enrichedBirthsignGroups,
      promptMessage,
      promptNote,
    }
  );

  // 7. Write output file
  fs.writeFileSync(path.join(OUTPUT_DIR, "birthsigns.md"), markdown);
  console.log("✅ Generated birthsigns.md");

  // 8. Write JSON for web use or ingestion
  fs.writeFileSync(
    path.join(OUTPUT_DIR, "birthsigns.json"),
    JSON.stringify(enrichedBirthsignGroups, null, 2)
  );

  console.log(`Found ${enrichedBirthsignGroups.length} birthsign groups`);
  enrichedBirthsignGroups.forEach((group) => {
    console.log(`  ${group.name}: ${group.birthsigns.length} birthsigns`);
  });
}

generate().catch(console.error);
