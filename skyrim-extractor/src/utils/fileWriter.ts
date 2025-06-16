import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { ParsedRecord } from "@lorerim/platform-types";
import { formatJSON } from "@lorerim/platform-types";

interface FileWriter {
  writeRecords(
    records: Record<string, ParsedRecord[]>,
    outputDir: string
  ): Promise<void>;
}

class FileWriterImpl implements FileWriter {
  /**
   * Write records to type-specific JSON files
   */
  async writeRecords(
    records: Record<string, ParsedRecord[]>,
    outputDir: string
  ): Promise<void> {
    // Ensure output directory exists
    await mkdir(outputDir, { recursive: true });

    // Write each record type to its own file
    for (const [type, typeRecords] of Object.entries(records)) {
      const filePath = path.join(outputDir, `${type}.json`);
      await writeFile(filePath, formatJSON(typeRecords));
    }
  }


}

/**
 * Create a new file writer instance
 */
export function createFileWriter(): FileWriter {
  return new FileWriterImpl();
}
