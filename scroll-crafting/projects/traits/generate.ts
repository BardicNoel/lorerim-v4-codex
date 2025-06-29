import { loadTraitRecords } from "./logic/loadTraitRecords.js";
import { resolveTraits } from "./logic/resolveTraits.js";
import { renderMarkdownTemplate } from "../../utils/renderMarkdownTemplate.js";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { mkdir, writeFile } from "fs/promises";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Generates the traits documentation by:
 * 1. Loading trait records (from form list and EDID pattern)
 * 2. Resolving traits into TraitDefinitions
 * 3. Rendering the markdown template
 * 4. Writing output files
 */
export async function generate() {
  // Load all trait records
  const records = await loadTraitRecords();
  
  // Resolve traits into TraitDefinitions
  const traits = resolveTraits(records.spells);

  // Set up template path
  const templatePath = join(__dirname, "templates", "primary.md");

  // Render markdown
  const markdown = await renderMarkdownTemplate(templatePath, { traits });

  // Set up output directory
  const outputDir = join(__dirname, "output");
  await mkdir(outputDir, { recursive: true });

  // Write markdown output
  const markdownPath = join(outputDir, "traits.md");
  await writeFile(markdownPath, markdown, "utf-8");

  // Write full JSON output
  const jsonPath = join(outputDir, "traits.json");
  await writeFile(jsonPath, JSON.stringify(traits, null, 2), "utf-8");

  // Write descriptive-only JSON output
  const descriptiveTraits = traits.map(({ name, description }) => ({ name, description }));
  const descriptiveJsonPath = join(outputDir, "traits_descriptive_only.json");
  await writeFile(descriptiveJsonPath, JSON.stringify(descriptiveTraits, null, 2), "utf-8");
  
  return {
    markdown,
    traits,
    outputFiles: {
      markdown: markdownPath,
      json: jsonPath,
      descriptiveJson: descriptiveJsonPath
    }
  };
}

// Run generator if called directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  generate().then(({ outputFiles }) => {
    console.log("Generated files:");
    console.log(`- Markdown: ${outputFiles.markdown}`);
    console.log(`- JSON: ${outputFiles.json}`);
    console.log(`- Descriptive JSON: ${outputFiles.descriptiveJson}`);
  }).catch(error => {
    console.error("Error generating traits documentation:", error);
    process.exit(1);
  });
} 