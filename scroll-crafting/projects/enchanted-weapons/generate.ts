import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { loadRecordSet, renderMarkdownTemplate } from "../../utils/index.js";
import {
  resolveEnchantedWeapons,
  groupWeaponsByCategory,
} from "./logic/resolveEnchantedWeapons.js";

// ESM-compatible __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECT_DIR = path.resolve(__dirname);
const RECORD_DIR = path.join(PROJECT_DIR, "records");
const PRIMARY_DIR = path.resolve(__dirname, "../../primaries");
const OUTPUT_DIR = path.join(PROJECT_DIR, "output");
const TEMPLATE_DIR = path.join(PROJECT_DIR, "templates");

async function main() {
  console.log("🚀 Starting enchanted weapons generation...");

  try {
    // 1. Load WEAP, ENCH, and MGEF records
    console.log("📂 Loading weapon records...");
    const weaponRecords = await loadRecordSet<any>(
      "WEAP",
      RECORD_DIR,
      PRIMARY_DIR
    );
    console.log(`   Loaded ${weaponRecords.length} weapon records`);

    console.log("📂 Loading enchantment records...");
    const enchantmentRecords = await loadRecordSet<any>(
      "ENCH",
      RECORD_DIR,
      PRIMARY_DIR
    );
    console.log(`   Loaded ${enchantmentRecords.length} enchantment records`);

    console.log("📂 Loading magic effect records...");
    const magicEffectRecords = await loadRecordSet<any>(
      "MGEF",
      RECORD_DIR,
      PRIMARY_DIR
    );
    console.log(`   Loaded ${magicEffectRecords.length} magic effect records`);

    // 2. Process records using logic
    console.log("🔗 Resolving enchanted weapons...");
    const enchantedWeapons = await resolveEnchantedWeapons(
      weaponRecords,
      enchantmentRecords,
      magicEffectRecords
    );
    console.log(`   Found ${enchantedWeapons.length} enchanted weapons`);

    // 3. Group by weapon category
    console.log("📊 Grouping weapons by category...");
    const weaponCategories = groupWeaponsByCategory(enchantedWeapons);
    console.log(`   Organized into ${weaponCategories.length} categories`);

    // 4. Prepare template context
    const templateContext = {
      weaponCategories,
      totalWeapons: enchantedWeapons.length,
      totalCategories: weaponCategories.length,
      generatedDate: new Date().toISOString().split("T")[0],
    };

    // 5. Render Markdown
    console.log("📝 Rendering Markdown...");
    const markdown = renderMarkdownTemplate(
      path.join(TEMPLATE_DIR, "primary.md"),
      templateContext
    );

    // 6. Write output
    console.log("💾 Writing output files...");
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });

    fs.writeFileSync(path.join(OUTPUT_DIR, "enchanted-weapons.md"), markdown);
    fs.writeFileSync(
      path.join(OUTPUT_DIR, "enchanted-weapons.json"),
      JSON.stringify(enchantedWeapons, null, 2)
    );

    console.log("✅ Enchanted weapons generation complete!");
    console.log(
      `   📄 Markdown: ${path.join(OUTPUT_DIR, "enchanted-weapons.md")}`
    );
    console.log(
      `   📊 JSON: ${path.join(OUTPUT_DIR, "enchanted-weapons.json")}`
    );
  } catch (error) {
    console.error("❌ Error generating enchanted weapons:", error);
    process.exit(1);
  }
}

main();
