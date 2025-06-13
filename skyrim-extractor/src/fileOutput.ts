import fs from 'fs';
import path from 'path';
import { ParsedRecord } from './types/record';

export async function writeRecords(records: ParsedRecord[], outputDir: string): Promise<void> {
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
    await fs.promises.writeFile(
      outputPath,
      JSON.stringify(typeRecords, null, 2),
      'utf-8'
    );
  }
} 