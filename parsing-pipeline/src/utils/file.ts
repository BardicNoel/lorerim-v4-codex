import * as fs from 'fs/promises';
import * as path from 'path';
import { JsonArray } from '../types/pipeline';

export async function readJsonFile(filePath: string): Promise<JsonArray> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const data = JSON.parse(content);
    
    if (!Array.isArray(data)) {
      throw new Error('Input JSON must be an array');
    }
    
    return data;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`Invalid JSON in file ${filePath}: ${error.message}`);
    }
    throw error;
  }
}

export async function writeJsonFile(filePath: string, data: JsonArray): Promise<void> {
  try {
    // Ensure output directory exists
    const outputDir = path.dirname(filePath);
    await fs.mkdir(outputDir, { recursive: true });

    // Write file with pretty formatting
    await fs.writeFile(
      filePath,
      JSON.stringify(data, null, 2),
      'utf-8'
    );
  } catch (error) {
    throw new Error(`Failed to write JSON file ${filePath}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export async function validateJsonFile(filePath: string): Promise<boolean> {
  try {
    await readJsonFile(filePath);
    return true;
  } catch (error) {
    return false;
  }
} 