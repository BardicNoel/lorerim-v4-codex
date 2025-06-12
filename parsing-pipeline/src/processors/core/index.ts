import { JsonArray, StageConfig, ProcessingResult } from '../../types/pipeline';
import { createFilterRecordsProcessor } from './filter-records';
import { createRemoveFieldsProcessor } from './remove-fields';
import { createKeepFieldsProcessor } from './keep-fields';
import { createSanitizeFieldsProcessor } from './sanitize-fields';

// Core processor interface
export interface Processor {
  transform: (data: JsonArray) => Promise<JsonArray>;
  getStats?: () => ProcessingResult;
}

// Create a processor from a stage configuration
export function createProcessor(stage: StageConfig): Processor {
  switch (stage.type) {
    case 'filter-records':
      return createFilterRecordsProcessor(stage);
    case 'remove-fields':
      return createRemoveFieldsProcessor(stage);
    case 'keep-fields':
      return createKeepFieldsProcessor(stage);
    case 'sanitize-fields':
      return createSanitizeFieldsProcessor(stage);
    default:
      throw new Error(`Unknown stage type: ${(stage as any).type}`);
  }
}

// Create a pipeline from multiple stages
export function createPipeline(stages: StageConfig[]): Processor {
  return {
    transform: async (data: JsonArray) => {
      let result = data;
      for (const stage of stages) {
        const processor = createProcessor(stage);
        result = await processor.transform(result);
      }
      return result;
    }
  };
} 