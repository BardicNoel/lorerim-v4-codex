import fs from "fs";
import path from "path";

export async function loadRecordSet<T>(
  tag: string,
  projectDir: string,
  fallbackDir: string
): Promise<T[]> {
  const projectPath = path.join(projectDir, tag);
  const fallbackPath = path.join(fallbackDir, tag);

  const entries = fs.existsSync(projectPath) ? fs.readdirSync(projectPath) : [];
  const fallbackEntries = fs.existsSync(fallbackPath)
    ? fs.readdirSync(fallbackPath)
    : [];

  const allFiles = new Set([...entries, ...fallbackEntries]);

  const records: T[] = [];

  for (const file of allFiles) {
    const basePath = fs.existsSync(path.join(projectPath, file))
      ? projectPath
      : fallbackPath;
    const content = fs.readFileSync(path.join(basePath, file), "utf-8");
    records.push(JSON.parse(content));
  }

  return records;
}
