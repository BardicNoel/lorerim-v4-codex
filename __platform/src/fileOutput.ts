import * as path from "path";
import { promises as fs } from "fs";
import { ParsedRecord } from "./types";
import { formatJSON } from "./formatter";

/**
 * Writes records to JSON files, grouped by record type.
 * Each record type will be written to its own file in the specified output directory.
 * Uses a custom JSON formatter that makes data fields with Buffer values compact while keeping other objects readable.
 *
 * @param records Array of ParsedRecord objects to write
 * @param outputDir Directory where the JSON files will be written
 * @returns Promise that resolves when all files are written
 */
export async function writeRecords(
  records: ParsedRecord[],
  outputDir: string
): Promise<void> {
  // Group records by type
  const recordsByType = records.reduce((acc, record) => {
    const type = record.meta.type;
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(record);
    return acc;
  }, {} as Record<string, ParsedRecord[]>);

  // Write each type to its own file
  for (const [type, typeRecords] of Object.entries(recordsByType)) {
    const outputPath = path.join(outputDir, `${type}.json`);
    await fs.writeFile(outputPath, formatJSON(typeRecords), "utf-8");
  }
}

export async function writeJsonFile(
  filePath: string,
  data: ParsedRecord[]
): Promise<void> {
  try {
    // Ensure output directory exists
    const outputDir = path.dirname(filePath);
    await fs.mkdir(outputDir, { recursive: true });

    // Write file with custom formatting
    await fs.writeFile(filePath, formatJSON(data), "utf-8");
  } catch (error) {
    throw new Error(
      `Failed to write JSON file ${filePath}: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}
