import fs from "fs";
import Handlebars from "handlebars";
import path from "path";

export function renderMarkdownTemplate(
  templatePath: string,
  context: any
): string {
  const primaryTemplate = fs.readFileSync(templatePath, "utf-8");

  const partialsDir = path.dirname(templatePath);
  const blockPath = path.join(partialsDir, "perk_block.md");
  if (fs.existsSync(blockPath)) {
    Handlebars.registerPartial(
      "perk_block",
      fs.readFileSync(blockPath, "utf-8")
    );
  }

  const template = Handlebars.compile(primaryTemplate);
  return template(context);
}
