import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import {
  loadRecordSet,
  findByFormId,
  renderMarkdownTemplate,
} from "../../utils/index.js";
import { resolveSubclasses } from "./logic/resolveSubclasses.js";
import { ParsedRecord } from "@lorerim/platform-types";

// ESM-compatible __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECT_DIR = path.resolve(__dirname);
const RECORD_DIR = path.join(PROJECT_DIR, "records");
const PRIMARY_DIR = path.resolve(__dirname, "../../primaries");
const OUTPUT_DIR = path.join(PROJECT_DIR, "output");
const TEMPLATE_DIR = path.join(PROJECT_DIR, "templates");

async function generateMermaidDiagram(
  destinyPerks: any[],
  perkRecords: ParsedRecord[]
): Promise<string> {
  // Build edges: for each perk, for each prerequisite, add edge prerequisite --> perk
  const edges: string[] = [];
  for (const perk of destinyPerks) {
    if (perk.prerequisites && Array.isArray(perk.prerequisites)) {
      for (const prereqId of perk.prerequisites) {
        const prereq = findByFormId(perkRecords, prereqId);
        if (prereq && (prereq.decodedData?.FULL || prereq.decodedData?.EDID)) {
          const from = prereq.decodedData.FULL || prereq.decodedData.EDID;
          const to = perk.name;
          edges.push(`  ${from} --> ${to}`);
        }
      }
    }
  }
  return ["graph TD", ...edges].join("\n");
}

async function main() {
  // 1. Load FLST and PERK records
  const flstRecords: ParsedRecord[] = await loadRecordSet(
    "FLST",
    RECORD_DIR,
    PRIMARY_DIR
  );
  const perkRecords: ParsedRecord[] = await loadRecordSet(
    "PERK",
    RECORD_DIR,
    PRIMARY_DIR
  );

  // 2. Find the Destiny Perk FLST record
  const destinyFlst = flstRecords.find(
    (r: ParsedRecord) =>
      r.decodedData?.EDID === "DAR_DestinyFormList" &&
      r.meta.plugin === "SubclassesOfSkyrim.esp"
  );
  if (!destinyFlst) {
    throw new Error(
      "Could not find Destiny Perk FLST record (DAR_DestinyFormList in SubclassesOfSkyrim.esp)"
    );
  }

  // 3. Resolve Destiny Perks
  const destinyPerks = resolveSubclasses(
    destinyFlst,
    perkRecords,
    findByFormId
  );

  // 4. Generate Mermaid diagram
  const mermaidDiagram = await generateMermaidDiagram(
    destinyPerks,
    perkRecords
  );

  // 5. Render Markdown
  const markdown = renderMarkdownTemplate(
    path.join(TEMPLATE_DIR, "primary.md"),
    { destinyPerks, mermaidDiagram }
  );

  // 6. Write output
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUTPUT_DIR, "subclasses.md"), markdown);
  fs.writeFileSync(
    path.join(OUTPUT_DIR, "subclasses.json"),
    JSON.stringify(destinyPerks, null, 2)
  );

  console.log("Generated subclasses.md and subclasses.json");
}

main().catch((err) => {
  console.error("Error generating Destiny Perks:", err);
  process.exit(1);
});
