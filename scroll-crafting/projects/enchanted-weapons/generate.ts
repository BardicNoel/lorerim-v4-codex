import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { loadRecordSet, renderMarkdownTemplate } from "../../utils/index.js";
import {
  resolveEnchantedWeapons,
  groupWeaponsByCategory,
} from "./logic/resolveEnchantedWeapons.js";
import { WeapRecord } from "../../types/weapSchema.js";
import { EnchRecord } from "../../types/enchSchema.js";
import { KywdRecord } from "../../types/kywdSchema.js";
import { MgefRecord } from "../../types/records.js";
import { errorLogger } from "./utils/errorLogger.js";
import { UniqueWeapon } from "./logic/weaponClassification.js";

// ESM-compatible __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECT_DIR = path.resolve(__dirname);
const RECORD_DIR = path.join(PROJECT_DIR, "records");
const PRIMARY_DIR = path.resolve(__dirname, "../../primaries");
const OUTPUT_DIR = path.join(PROJECT_DIR, "output");
const TEMPLATE_DIR = path.join(PROJECT_DIR, "templates");

async function main() {
  console.log("🚀 Starting enhanced enchanted weapons generation...");

  try {
    // 1. Load WEAP, ENCH, and MGEF records
    console.log("📂 Loading weapon records...");
    const weaponRecords = await loadRecordSet<WeapRecord>(
      "WEAP",
      RECORD_DIR,
      PRIMARY_DIR
    );
    console.log(`   Loaded ${weaponRecords.length} weapon records`);

    console.log("📂 Loading enchantment records...");
    const enchantmentRecords = await loadRecordSet<EnchRecord>(
      "ENCH",
      RECORD_DIR,
      PRIMARY_DIR
    );
    console.log(`   Loaded ${enchantmentRecords.length} enchantment records`);

    console.log("📂 Loading magic effect records...");
    const magicEffectRecords = await loadRecordSet<MgefRecord>(
      "MGEF",
      RECORD_DIR,
      PRIMARY_DIR
    );
    console.log(`   Loaded ${magicEffectRecords.length} magic effect records`);

    console.log("📂 Loading keyword records...");
    const keywordRecords = await loadRecordSet<KywdRecord>(
      "KYWD",
      RECORD_DIR,
      PRIMARY_DIR
    );
    console.log(`   Loaded ${keywordRecords.length} keyword records`);

    // 2. Process records using logic
    const {
      uniqueWeapons,
      generalWeaponTemplates,
      generalWeaponEnchantments,
      baseWeaponTemplates,
      allWeapons,
      boundMysticWeapons,
      wandStaffWeapons,
    } = await resolveEnchantedWeapons(
      weaponRecords,
      enchantmentRecords,
      magicEffectRecords,
      keywordRecords
    );

    // 3. Group by weapon category
    const weaponCategories = groupWeaponsByCategory(allWeapons);

    // Group templates by weapon type
    function groupByWeaponType<T extends { weaponType: string }>(
      templates: T[]
    ): Record<string, T[]> {
      const groups: Record<string, T[]> = {};
      for (const template of templates) {
        if (!groups[template.weaponType]) {
          groups[template.weaponType] = [];
        }
        groups[template.weaponType].push(template);
      }
      return groups;
    }

    const groupedBaseWeaponTemplates = groupByWeaponType(baseWeaponTemplates);
    const groupedGeneralWeaponTemplates = groupByWeaponType(
      generalWeaponTemplates
    );

    // 4. Prepare template contexts
    const generatedDate = new Date().toISOString().split("T")[0];

    // Index document context
    const indexContext = {
      uniqueWeapons,
      generalWeaponTemplates,
      groupedGeneralWeaponTemplates,
      generalWeaponEnchantments,
      baseWeaponTemplates,
      groupedBaseWeaponTemplates,
      boundMysticWeapons,
      wandStaffWeapons,
      totalWeapons:
        allWeapons.length + boundMysticWeapons.length + wandStaffWeapons.length,
      totalGeneralWeapons: allWeapons.length - uniqueWeapons.length,
      generatedDate,
    };

    // Group and sort unique weapons by weapon type
    const uniqueWeaponGroups = uniqueWeapons.reduce(
      (groups: Record<string, UniqueWeapon[]>, weapon) => {
        if (!groups[weapon.weaponType]) {
          groups[weapon.weaponType] = [];
        }
        groups[weapon.weaponType].push(weapon);
        return groups;
      },
      {}
    );

    // Sort weapon types alphabetically and sort weapons within each group by base damage
    const sortedWeaponGroups: Record<string, UniqueWeapon[]> = {};
    Object.keys(uniqueWeaponGroups)
      .sort()
      .forEach((weaponType) => {
        sortedWeaponGroups[weaponType] = uniqueWeaponGroups[weaponType].sort(
          (a, b) => b.baseDamage - a.baseDamage
        );
      });

    // Unique weapons context with sorted groups
    const uniqueContext = {
      weaponGroups: sortedWeaponGroups,
      totalUniqueWeapons: uniqueWeapons.length,
      weaponTypes: Object.keys(sortedWeaponGroups),
      generatedDate,
    };

    // General weapon templates context
    const generalTemplatesContext = {
      generalWeaponTemplates,
      groupedGeneralWeaponTemplates,
      totalGeneralWeapons: allWeapons.length - uniqueWeapons.length,
      generatedDate,
    };

    // Base weapon templates context
    const baseTemplatesContext = {
      baseWeaponTemplates,
      groupedBaseWeaponTemplates,
      generatedDate,
    };

    // General weapon enchantments context
    const generalEnchantmentsContext = {
      generalWeaponEnchantments,
      totalGeneralWeapons: allWeapons.length - uniqueWeapons.length,
      generatedDate,
    };

    // Bound weapons context
    const boundCount = boundMysticWeapons.filter((w) => w.isBound).length;
    const mysticCount = boundMysticWeapons.filter((w) => !w.isBound).length;
    const boundContext = {
      boundMysticWeapons,
      boundCount,
      mysticCount,
      generatedDate,
    };

    // Wands and staves context
    const wandStaffContext = {
      wandStaffWeapons,
      generatedDate,
    };

    // 5. Render Markdown documents
    console.log("📝 Rendering separate Markdown documents...");

    const indexMarkdown = renderMarkdownTemplate(
      path.join(TEMPLATE_DIR, "index.md"),
      indexContext
    );

    const uniqueMarkdown = renderMarkdownTemplate(
      path.join(TEMPLATE_DIR, "unique-weapons.md"),
      uniqueContext
    );

    const generalTemplatesMarkdown = renderMarkdownTemplate(
      path.join(TEMPLATE_DIR, "general-weapon-templates.md"),
      generalTemplatesContext
    );

    const baseTemplatesMarkdown = renderMarkdownTemplate(
      path.join(TEMPLATE_DIR, "base-weapon-templates.md"),
      baseTemplatesContext
    );

    const generalEnchantmentsMarkdown = renderMarkdownTemplate(
      path.join(TEMPLATE_DIR, "general-weapon-enchants.md"),
      generalEnchantmentsContext
    );

    const boundMarkdown = renderMarkdownTemplate(
      path.join(TEMPLATE_DIR, "bound-weapons.md"),
      boundContext
    );

    const wandStaffMarkdown = renderMarkdownTemplate(
      path.join(TEMPLATE_DIR, "wands-staves.md"),
      wandStaffContext
    );

    // 6. Write output
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });

    // Write Markdown documents
    fs.writeFileSync(path.join(OUTPUT_DIR, "index.md"), indexMarkdown);
    fs.writeFileSync(
      path.join(OUTPUT_DIR, "unique-weapons.md"),
      uniqueMarkdown
    );
    fs.writeFileSync(
      path.join(OUTPUT_DIR, "general-weapon-templates.md"),
      generalTemplatesMarkdown
    );
    fs.writeFileSync(
      path.join(OUTPUT_DIR, "base-weapon-templates.md"),
      baseTemplatesMarkdown
    );
    fs.writeFileSync(
      path.join(OUTPUT_DIR, "general-weapon-enchants.md"),
      generalEnchantmentsMarkdown
    );
    fs.writeFileSync(path.join(OUTPUT_DIR, "bound-weapons.md"), boundMarkdown);
    fs.writeFileSync(
      path.join(OUTPUT_DIR, "wands-staves.md"),
      wandStaffMarkdown
    );

    // Write JSON files
    fs.writeFileSync(
      path.join(OUTPUT_DIR, "enchanted-weapons.json"),
      JSON.stringify(allWeapons, null, 2)
    );
    fs.writeFileSync(
      path.join(OUTPUT_DIR, "general-weapon-templates.json"),
      JSON.stringify(generalWeaponTemplates, null, 2)
    );
    fs.writeFileSync(
      path.join(OUTPUT_DIR, "base-weapon-templates.json"),
      JSON.stringify(baseWeaponTemplates, null, 2)
    );
    fs.writeFileSync(
      path.join(OUTPUT_DIR, "general-weapon-enchants.json"),
      JSON.stringify(generalWeaponEnchantments, null, 2)
    );
    fs.writeFileSync(
      path.join(OUTPUT_DIR, "unique-weapons.json"),
      JSON.stringify(uniqueWeapons, null, 2)
    );
    fs.writeFileSync(
      path.join(OUTPUT_DIR, "bound-mystic-weapons.json"),
      JSON.stringify(boundMysticWeapons, null, 2)
    );
    fs.writeFileSync(
      path.join(OUTPUT_DIR, "wands-staves.json"),
      JSON.stringify(wandStaffWeapons, null, 2)
    );

    // 7. Write error reports
    console.log("📊 Writing error reports...");
    errorLogger.writeToFile();
    errorLogger.writeSummaryReport();

    console.log("✅ Enhanced enchanted weapons generation complete!");
    console.log("   📄 Index: " + path.join(OUTPUT_DIR, "index.md"));
    console.log(
      "   📄 Unique Weapons: " + path.join(OUTPUT_DIR, "unique-weapons.md")
    );
    console.log(
      "   📄 General Weapon Templates: " +
        path.join(OUTPUT_DIR, "general-weapon-templates.md")
    );
    console.log(
      "   📄 Base Weapon Templates: " +
        path.join(OUTPUT_DIR, "base-weapon-templates.md")
    );
    console.log(
      "   📄 General Weapon Enchants: " +
        path.join(OUTPUT_DIR, "general-weapon-enchants.md")
    );
    console.log(
      "   📄 Bound Weapons: " + path.join(OUTPUT_DIR, "bound-weapons.md")
    );
    console.log(
      "   📄 Wands & Staves: " + path.join(OUTPUT_DIR, "wands-staves.md")
    );
    console.log("   📊 Error Reports: " + path.join(PROJECT_DIR, "errors"));

    // Print error statistics
    const stats = errorLogger.getStats();
    if (stats.total > 0) {
      console.log(`⚠️  Generated with ${stats.total} errors/warnings`);
      console.log(`   - By Level: ${JSON.stringify(stats.byLevel)}`);
      console.log(`   - By Category: ${JSON.stringify(stats.byCategory)}`);
    } else {
      console.log("✅ No errors or warnings encountered");
    }
  } catch (error) {
    errorLogger.logError("Fatal error in main generation process", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    // Write error reports even on fatal error
    errorLogger.writeToFile();
    errorLogger.writeSummaryReport();

    console.error("❌ Fatal error in enchanted weapons generation:", error);
    process.exit(1);
  }
}

main();
