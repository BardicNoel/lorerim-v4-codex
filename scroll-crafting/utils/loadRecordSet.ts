import fs from "fs";
import path from "path";

export async function loadRecordSet<T>(
  tag: string,
  projectDir: string,
  fallbackDir: string
): Promise<T[]> {
  const projectFile = path.join(projectDir, `${tag.toLowerCase()}.json`);
  const projectFilePlural = path.join(projectDir, `${tag.toLowerCase()}s.json`);
  const fallbackFile = path.join(fallbackDir, `${tag.toLowerCase()}.json`);
  const fallbackFilePlural = path.join(fallbackDir, `${tag.toLowerCase()}s.json`);

  console.log(`🔍 loadRecordSet: Loading ${tag} records...`);
  console.log(`   - Project file (singular): ${projectFile}`);
  console.log(`   - Project file (plural): ${projectFilePlural}`);
  console.log(`   - Fallback file (singular): ${fallbackFile}`);
  console.log(`   - Fallback file (plural): ${fallbackFilePlural}`);
  console.log(`   - Project file (singular) exists: ${fs.existsSync(projectFile)}`);
  console.log(`   - Project file (plural) exists: ${fs.existsSync(projectFilePlural)}`);
  console.log(`   - Fallback file (singular) exists: ${fs.existsSync(fallbackFile)}`);
  console.log(`   - Fallback file (plural) exists: ${fs.existsSync(fallbackFilePlural)}`);

  // First, try project-specific files (singular then plural)
  if (fs.existsSync(projectFile)) {
    console.log(`   ✅ Loading from project file (singular): ${projectFile}`);
    const content = fs.readFileSync(projectFile, "utf-8");
    const data = JSON.parse(content);
    const result = Array.isArray(data) ? data : [data];
    console.log(`   - Loaded ${result.length} records from project file (singular)`);
    return result;
  }

  if (fs.existsSync(projectFilePlural)) {
    console.log(`   ✅ Loading from project file (plural): ${projectFilePlural}`);
    const content = fs.readFileSync(projectFilePlural, "utf-8");
    const data = JSON.parse(content);
    const result = Array.isArray(data) ? data : [data];
    console.log(`   - Loaded ${result.length} records from project file (plural)`);
    return result;
  }

  // Fall back to primaries files (singular then plural)
  if (fs.existsSync(fallbackFile)) {
    console.log(`   ✅ Loading from fallback file (singular): ${fallbackFile}`);
    const content = fs.readFileSync(fallbackFile, "utf-8");
    const data = JSON.parse(content);
    const result = Array.isArray(data) ? data : [data];
    console.log(`   - Loaded ${result.length} records from fallback file (singular)`);
    return result;
  }

  if (fs.existsSync(fallbackFilePlural)) {
    console.log(`   ✅ Loading from fallback file (plural): ${fallbackFilePlural}`);
    const content = fs.readFileSync(fallbackFilePlural, "utf-8");
    const data = JSON.parse(content);
    const result = Array.isArray(data) ? data : [data];
    console.log(`   - Loaded ${result.length} records from fallback file (plural)`);
    return result;
  }

  console.log(`   ❌ No files found for ${tag} records`);
  return [];
}
