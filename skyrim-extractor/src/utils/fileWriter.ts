import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { ParsedRecord } from '../types';

interface FileWriter {
  writeRecords(records: Record<string, ParsedRecord[]>, outputDir: string): Promise<void>;
  writeStats(stats: Record<string, number>, outputDir: string): Promise<void>;
}

class FileWriterImpl implements FileWriter {
  /**
   * Write records to type-specific JSON files
   */
  async writeRecords(records: Record<string, ParsedRecord[]>, outputDir: string): Promise<void> {
    // Ensure output directory exists
    await mkdir(outputDir, { recursive: true });

    // Write each record type to its own file
    for (const [type, typeRecords] of Object.entries(records)) {
      const filePath = path.join(outputDir, `${type}.json`);
      await writeFile(filePath, JSON.stringify(typeRecords, null, 2));
    }
  }

  /**
   * Write statistics and metadata to index.json
   */
  async writeStats(stats: Record<string, number>, outputDir: string): Promise<void> {
    const indexPath = path.join(outputDir, 'index.json');
    await writeFile(indexPath, JSON.stringify({
      stats,
      timestamp: new Date().toISOString(),
      recordTypes: Object.keys(stats)
    }, null, 2));
  }
}

/**
 * Create a new file writer instance
 */
export function createFileWriter(): FileWriter {
  return new FileWriterImpl();
} 