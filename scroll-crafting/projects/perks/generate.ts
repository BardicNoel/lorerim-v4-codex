import fs from "fs";
import path from "path";
import { loadRecordSet } from "../../utils/index.js";
import { renderMarkdownTemplate } from "../../utils/index.js";

const PROJECT_DIR = path.resolve(__dirname);
const RECORD_DIR = path.join(PROJECT_DIR, "records");
const PRIMARY_DIR = path.resolve("primaries"); // shared root-level fallback
const OUTPUT_DIR = path.join(PROJECT_DIR, "output");
const TEMPLATE_DIR = path.join(PROJECT_DIR, "templates");

interface Perk {
  name: string;
  edid: string;
  formid: string;
  description: string;
}

async function generate() {
  // 1. Load all PERK records, falling back to primaries if needed
  const perks: Perk[] = await loadRecordSet<Perk>(
    "PERK",
    RECORD_DIR,
    PRIMARY_DIR
  );

  // 2. Render Markdown
  const markdown = renderMarkdownTemplate(
    path.join(TEMPLATE_DIR, "primary.md"),
    { perks } // pass context into the template
  );
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUTPUT_DIR, "perks.md"), markdown);

  // 3. Write JSON for web use or ingestion
  fs.writeFileSync(
    path.join(OUTPUT_DIR, "perks.json"),
    JSON.stringify(perks, null, 2)
  );

  console.log(`Generated perks.md and perks.json`);
}

generate().catch(console.error);
