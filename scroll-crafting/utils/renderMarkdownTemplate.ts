import fs from "fs";
import Handlebars from "handlebars";
import path from "path";

export function renderMarkdownTemplate(
  templatePath: string,
  context: any
): string {
  const primaryTemplate = fs.readFileSync(templatePath, "utf-8");

  const partialsDir = path.dirname(templatePath);
  // Register all .md files in the partials directory as partials
  const files = fs.readdirSync(partialsDir);
  for (const file of files) {
    if (file.endsWith('.md') && file !== path.basename(templatePath)) {
      const partialName = path.basename(file, '.md');
      Handlebars.registerPartial(
        partialName,
        fs.readFileSync(path.join(partialsDir, file), "utf-8")
      );
    }
  }

  const template = Handlebars.compile(primaryTemplate);
  return template(context);
}
