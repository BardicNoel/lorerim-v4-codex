import { StageConfig } from '../types/pipeline';

export function parsePipelineStages(stagesJson: string): StageConfig[] {
  try {
    return JSON.parse(stagesJson);
  } catch (error) {
    throw new Error(`Invalid pipeline stages JSON: ${error instanceof Error ? error.message : String(error)}`);
  }
} 