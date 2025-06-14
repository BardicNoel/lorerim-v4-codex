import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { ParsedRecord } from '../types';
import { ProcessingStats } from './stats';
import { formatJSON } from '@lorerim/platform-types';

interface FileWriter {
  writeRecords(records: Record<string, ParsedRecord[]>, outputDir: string): Promise<void>;
  writeStats(stats: ProcessingStats, outputDir: string): Promise<void>;
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
      await writeFile(filePath, formatJSON(typeRecords));
    }
  }

  /**
   * Write statistics and metadata to index.json
   */
  async writeStats(stats: ProcessingStats, outputDir: string): Promise<void> {
    const indexPath = path.join(outputDir, 'index.json');
    await writeFile(indexPath, formatJSON({
      stats: {
        totalRecords: stats.totalRecords,
        recordsByType: stats.recordsByType,
        skippedRecords: stats.skippedRecords,
        skippedTypes: Array.from(stats.skippedTypes),
        totalBytes: stats.totalBytes,
        processingTime: stats.processingTime,
        pluginsProcessed: stats.pluginsProcessed,
        errors: stats.errors
      },
      timestamp: new Date().toISOString(),
      recordTypes: Object.keys(stats.recordsByType)
    }));
  }
}

/**
 * Create a new file writer instance
 */
export function createFileWriter(): FileWriter {
  return new FileWriterImpl();
} 