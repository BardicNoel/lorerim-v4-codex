import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import {
  loadRecordSet,
  findByFormId,
  renderMarkdownTemplate,
} from "../../utils/index.js";
import { resolveSubclasses } from "./logic/resolveSubclasses.js";
import { FlstRecordSchema, FlstRecordFromSchema } from "../../types/flstSchema.js";
import { PerkRecordSchema, PerkRecordFromSchema } from "../../types/perkSchema.js";
import { z } from "zod";
import { generateFlowchart, MermaidNode, MermaidEdge } from '../../utils/mermaid.js';

// ESM-compatible __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECT_DIR = path.resolve(__dirname);
const RECORD_DIR = path.join(PROJECT_DIR, "records");
const PRIMARY_DIR = path.resolve(__dirname, "../../primaries");
const OUTPUT_DIR = path.join(PROJECT_DIR, "output");
const TEMPLATE_DIR = path.join(PROJECT_DIR, "templates");

async function main() {
  console.log("🚀 Starting subclasses generation...");
  console.log(`   - Record dir: ${RECORD_DIR}`);
  console.log(`   - Primary dir: ${PRIMARY_DIR}`);
  console.log(`   - Template dir: ${TEMPLATE_DIR}`);
  console.log(`   - Output dir: ${OUTPUT_DIR}`);

  // 1. Load FLST and PERK records
  console.log("\n📂 Loading FLST records...");
  const flstRecordsRaw = await loadRecordSet<any>(
    "FLST",
    RECORD_DIR,
    PRIMARY_DIR
  );
  console.log(`   - Loaded ${flstRecordsRaw.length} FLST records`);
  
  console.log("\n📂 Loading PERK records...");
  const perkRecordsRaw = await loadRecordSet<any>(
    "PERK",
    RECORD_DIR,
    PRIMARY_DIR
  );
  console.log(`   - Loaded ${perkRecordsRaw.length} PERK records`);

  // Debug: Show some FLST records
  console.log("\n🔍 Sample FLST records:");
  flstRecordsRaw.slice(0, 3).forEach((record, i) => {
    console.log(`   ${i + 1}. ${record.data?.EDID || 'No EDID'} (${record.meta?.plugin})`);
  });

  // 2. Validate FLST and PERK records
  const flstRecords: FlstRecordFromSchema[] = [];
  for (const rec of flstRecordsRaw) {
    const parsed = FlstRecordSchema.safeParse(rec);
    if (parsed.success) {
      flstRecords.push(parsed.data);
    } else {
      // Optionally log validation errors
      // console.log('Invalid FLST record:', parsed.error);
    }
  }

  const perkRecords: PerkRecordFromSchema[] = [];
  for (const rec of perkRecordsRaw) {
    const parsed = PerkRecordSchema.safeParse(rec);
    if (parsed.success) {
      perkRecords.push(parsed.data);
    } else {
      // Optionally log validation errors
      // console.log('Invalid PERK record:', parsed.error);
    }
  }

  // 3. Find the Destiny Perk FLST record
  console.log("\n🔍 Looking for Destiny Perk FLST record...");
  const destinyFlst = flstRecords.find(
    (r) =>
      r.data.EDID === "DAR_DestinyFormList" &&
      r.meta.plugin === "SubclassesOfSkyrim.esp"
  );
  
  if (!destinyFlst) {
    console.error("❌ Could not find Destiny Perk FLST record!");
    console.log("Available FLST records with EDID:");
    flstRecords.forEach((record, i) => {
      if (record.data?.EDID) {
        console.log(`   ${i + 1}. ${record.data.EDID} (${record.meta?.plugin})`);
      }
    });
    throw new Error(
      "Could not find Destiny Perk FLST record (DAR_DestinyFormList in SubclassesOfSkyrim.esp)"
    );
  }
  
  console.log("✅ Found Destiny Perk FLST record!");
  console.log(`   - EDID: ${destinyFlst.data?.EDID}`);
  console.log(`   - Plugin: ${destinyFlst.meta?.plugin}`);
  console.log(`   - LNAM data: ${JSON.stringify(destinyFlst.data?.LNAM)}`);

  // 4. Resolve Destiny Perks
  console.log("\n🔍 Resolving Destiny Perks...");
  const destinyPerks = await resolveSubclasses(
    destinyFlst,
    perkRecords
  );
  console.log(`   - Resolved ${destinyPerks.length} Destiny perks`);
  
  // Debug: Show resolved perks
  destinyPerks.forEach((perk, i) => {
    console.log(`   ${i + 1}. ${perk.name}`);
    console.log(`      Description: ${perk.description || 'None'}`);
    console.log(`      Prerequisites: ${JSON.stringify(perk.prerequisites)}`);
  });

  // 5. Generate Mermaid diagram using the utility
  console.log("\n📊 Generating Mermaid diagram...");
  // Build nodes and edges
  const nodes: MermaidNode[] = destinyPerks.map(perk => ({
    id: perk.globalFormId,
    label: perk.name,
  }));
  const edges: MermaidEdge[] = [];
  for (const perk of destinyPerks) {
    for (const prereqName of perk.prerequisites) {
      const prereqPerk = destinyPerks.find(p => p.name === prereqName);
      if (prereqPerk) {
        edges.push({ from: prereqPerk.globalFormId, to: perk.globalFormId });
      }
    }
  }
  const mermaidDiagram = generateFlowchart(nodes, edges, { direction: 'TD' });

  // 6. Render Markdown
  console.log("\n📝 Rendering Markdown...");
  console.log(`   - Template path: ${path.join(TEMPLATE_DIR, "primary.md")}`);
  console.log(`   - Template exists: ${fs.existsSync(path.join(TEMPLATE_DIR, "primary.md"))}`);
  
  const templateData = { destinyPerks, mermaidDiagram };
  console.log(`   - Template data keys: ${Object.keys(templateData)}`);
  console.log(`   - Destiny perks count: ${destinyPerks.length}`);
  console.log(`   - Mermaid diagram length: ${mermaidDiagram.length}`);
  
  const markdown = renderMarkdownTemplate(
    path.join(TEMPLATE_DIR, "primary.md"),
    templateData
  );
  
  console.log(`   - Generated markdown length: ${markdown.length}`);
  console.log(`   - Markdown preview: ${markdown.substring(0, 200)}...`);

  // 7. Write output
  console.log("\n💾 Writing output...");
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUTPUT_DIR, "subclasses.md"), markdown);
  fs.writeFileSync(
    path.join(OUTPUT_DIR, "subclasses.json"),
    JSON.stringify(destinyPerks, null, 2)
  );

  console.log("✅ Generated subclasses.md and subclasses.json");
  console.log(`   - Output directory: ${OUTPUT_DIR}`);
}

main().catch((err) => {
  console.error("❌ Error generating Destiny Perks:", err);
  process.exit(1);
});
