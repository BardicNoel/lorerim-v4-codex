import { loadTraitRecords } from "./logic/loadTraitRecords.js";
import { resolveTraits } from "./logic/resolveTraits.js";
import { renderMarkdownTemplate } from "../../utils/renderMarkdownTemplate.js";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { mkdir, writeFile } from "fs/promises";
import { TraitCategory, EnhancedTrait } from "./types.js";
import path from "path";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Creates an anchor-friendly version of a string
 */
function createAnchor(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

/**
 * Groups traits by their categories
 */
function groupTraitsByCategory(traits: EnhancedTrait[]): Record<string, EnhancedTrait[]> {
  const categories = new Map<string, EnhancedTrait[]>();

  // Initialize categories
  Object.values(TraitCategory).forEach(category => {
    categories.set(category, []);
  });

  // Group traits by their categories
  traits.forEach(trait => {
    trait.tags.forEach(category => {
      const categoryTraits = categories.get(category) || [];
      categoryTraits.push(trait);
      categories.set(category, categoryTraits);
    });
  });

  // Convert Map to Record and sort traits within each category
  const result: Record<string, EnhancedTrait[]> = {};
  categories.forEach((traits, category) => {
    if (traits.length > 0) {
      result[category] = traits.sort((a, b) => a.name.localeCompare(b.name));
    }
  });

  return result;
}

/**
 * Generates the traits documentation by:
 * 1. Loading trait records (from form list and EDID pattern)
 * 2. Resolving traits into EnhancedTraits with MGEF data
 * 3. Grouping traits by category
 * 4. Rendering the markdown template
 * 5. Writing output files
 */
export async function generate() {
  // Load all trait records
  const records = await loadTraitRecords();
  
  // Resolve traits into EnhancedTraits
  const traits = resolveTraits(records.spells, records.getMgef);

  // Group traits by category
  const categories = groupTraitsByCategory(traits);

  // Set up template path
  const templatePath = join(__dirname, "templates", "primary.md");

  // Render markdown with both flat list and category groups
  const markdown = await renderMarkdownTemplate(templatePath, { 
    traits,
    categories
  });

  // Set up output directory
  const outputDir = join(__dirname, "output");
  await mkdir(outputDir, { recursive: true });

  // Write markdown output
  const markdownPath = join(outputDir, "traits.md");
  await writeFile(markdownPath, markdown, "utf-8");

  // Write full JSON output
  const jsonPath = join(outputDir, "traits.json");
  await writeFile(jsonPath, JSON.stringify({ traits, categories }, null, 2), "utf-8");

  // Write YAML for easy reading
  const yaml = `traits:\n${traits.map(trait => `
  - name: ${trait.name}
    tags: [${trait.tags.join(", ")}]
    description: "${trait.description}"
    effects:${trait.effects.map(effect => `
      - { type: ${effect.type}, value: "${effect.value}"${effect.scope ? `, scope: ${JSON.stringify(effect.scope)}` : ""}${effect.condition ? `, condition: "${effect.condition}"` : ""} }`).join("")}
`).join("")}`;

  await writeFile(join(outputDir, "traits.yaml"), yaml, "utf-8");

  return {
    markdown,
    traits,
    categories,
    outputFiles: {
      markdown: markdownPath,
      json: jsonPath
    }
  };
}

// Run generator if called directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  generate().then(({ outputFiles }) => {
    console.log("Generated files:");
    console.log(`- Markdown: ${outputFiles.markdown}`);
    console.log(`- JSON: ${outputFiles.json}`);
  }).catch(error => {
    console.error("Error generating traits documentation:", error);
    process.exit(1);
  });
} 