import fs from "fs";
import Handlebars from "handlebars";
import path from "path";

// Helper function to italicize numbers in descriptions
function replaceNumbers(text: string) {
  return text.replace(/\d+/g, (match) => `_${match}_`);
}

// Register math helper for division operations
Handlebars.registerHelper(
  "math",
  function (lvalue: number, operator: string, rvalue: number) {
    if (operator === "/") {
      // Round to 2 decimal places for readability
      return Math.round((lvalue / rvalue) * 100) / 100;
    }
    return lvalue;
  }
);

// Register helper to italicize numbers in descriptions
Handlebars.registerHelper("replaceNumbers", replaceNumbers);

export function renderMarkdownTemplate(
  templatePath: string,
  context: any
): string {
  const primaryTemplate = fs.readFileSync(templatePath, "utf-8");

  const partialsDir = path.dirname(templatePath);
  // Register all .md files in the partials directory as partials
  const files = fs.readdirSync(partialsDir);
  for (const file of files) {
    if (file.endsWith(".md") && file !== path.basename(templatePath)) {
      const partialName = path.basename(file, ".md");
      Handlebars.registerPartial(
        partialName,
        fs.readFileSync(path.join(partialsDir, file), "utf-8")
      );
    }
  }

  const template = Handlebars.compile(primaryTemplate);
  return template(context);
}
