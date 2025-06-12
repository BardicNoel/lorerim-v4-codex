import { Processor } from '../processors/core';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface ProcessingResult {
  recordsProcessed: number;
  errors?: Error[];
}

export async function processFile(
  processor: Processor,
  inputPath: string,
  outputPath: string
): Promise<ProcessingResult> {
  try {
    // Read input file
    const inputData = await fs.readFile(inputPath, 'utf-8');
    const jsonData = JSON.parse(inputData);

    // Process data
    const processedData = await processor.transform(jsonData);

    // Ensure output directory exists
    const outputDir = path.dirname(outputPath);
    await fs.mkdir(outputDir, { recursive: true });

    // Write output file
    await fs.writeFile(
      outputPath,
      JSON.stringify(processedData, null, 2),
      'utf-8'
    );

    return {
      recordsProcessed: Array.isArray(processedData) ? processedData.length : 1
    };
  } catch (error) {
    throw new Error(`File processing failed: ${error instanceof Error ? error.message : String(error)}`);
  }
} 