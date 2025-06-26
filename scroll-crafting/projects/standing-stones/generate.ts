import fs from "fs";
import path from "path";
import { loadRecordSet } from "../../utils/loadRecordSet";
import { renderMarkdownTemplate } from "../../utils/renderMarkdownTemplate";

const PROJECT_DIR = path.resolve(__dirname);
const RECORD_DIR = path.join(PROJECT_DIR, "records");
const PRIMARY_DIR = path.resolve("primaries"); // shared root-level fallback
const OUTPUT_DIR = path.join(PROJECT_DIR, "output");
const TEMPLATE_DIR = path.join(PROJECT_DIR, "templates");

interface StandingStone {
  name: string;
  edid: string;
  formid: string;
  description: string;
  location?: string;
  effects?: string[];
}

async function generate() {
  // 1. Load all STON records, falling back to primaries if needed
  const standingStones: StandingStone[] = await loadRecordSet<StandingStone>(
    "STON",
    RECORD_DIR,
    PRIMARY_DIR
  );

  // 2. Render Markdown
  const markdown = renderMarkdownTemplate(
    path.join(TEMPLATE_DIR, "primary.md"),
    { standingStones } // pass context into the template
  );
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUTPUT_DIR, "standing-stones.md"), markdown);

  // 3. Write JSON for web use or ingestion
  fs.writeFileSync(
    path.join(OUTPUT_DIR, "standing-stones.json"),
    JSON.stringify(standingStones, null, 2)
  );

  console.log(`Generated standing-stones.md and standing-stones.json`);
}

generate().catch(console.error); 