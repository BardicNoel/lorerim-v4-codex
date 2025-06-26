import fs from "fs";
import path from "path";

export async function loadRecordSet<T>(
  tag: string,
  projectDir: string,
  fallbackDir: string
): Promise<T[]> {
  const projectFile = path.join(projectDir, `${tag.toLowerCase()}.json`);
  const fallbackFile = path.join(fallbackDir, `${tag.toLowerCase()}.json`);

  // First, try project-specific file
  if (fs.existsSync(projectFile)) {
    const content = fs.readFileSync(projectFile, "utf-8");
    const data = JSON.parse(content);
    return Array.isArray(data) ? data : [data];
  }

  // Fall back to primaries file
  if (fs.existsSync(fallbackFile)) {
    const content = fs.readFileSync(fallbackFile, "utf-8");
    const data = JSON.parse(content);
    return Array.isArray(data) ? data : [data];
  }

  return [];
}
