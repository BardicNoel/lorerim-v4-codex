import { writeFile, mkdir, readFile } from "fs/promises";
import { buildPath, PATHS } from "../utils/paths";
import { formatJSON } from "@lorerim/platform-types";

/**
 * Centralized file operations
 */
export const FileOps = {
  /**
   * Ensure a directory exists, creating it if necessary
   */
  async ensureDir(path: string): Promise<void> {
    await mkdir(path, { recursive: true });
  },

  /**
   * Write JSON data to a file with proper formatting
   */
  async writeJson(path: string, data: unknown): Promise<void> {
    await writeFile(path, formatJSON(data));
  },

  /**
   * Read and parse JSON data from a file
   */
  async readJson<T>(path: string): Promise<T> {
    const content = await readFile(path, "utf-8");
    return JSON.parse(content);
  },

  /**
   * Write records to type-specific JSON files
   */
  async writeRecords(
    records: Record<string, unknown[]>,
    outputDir: string
  ): Promise<void> {
    // Ensure output directory exists
    await this.ensureDir(buildPath(outputDir, PATHS.OUTPUT.RECORDS));

    // Write each record type to its own file
    for (const [type, typeRecords] of Object.entries(records)) {
      const filePath = buildPath(
        outputDir,
        PATHS.OUTPUT.RECORDS,
        `${type}.json`
      );
      await this.writeJson(filePath, typeRecords);
    }
  }

 
};
