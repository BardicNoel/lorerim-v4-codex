import { JsonArray, StageConfig, ProcessingResult } from '../../types/pipeline';
import { createFilterRecordsProcessor } from './filter-records';
import { createRemoveFieldsProcessor } from './remove-fields';
import { createKeepFieldsProcessor } from './keep-fields';
import { createSanitizeFieldsProcessor } from './sanitize-fields';
import { createBufferDecoderProcessor } from '../buffer-decoder/parser';
import { formatJSON } from '@lorerim/platform-types';
import { createFlattenFieldsProcessor } from './flatten-fields';
import { createMergeRecordsProcessor } from './merge-records';

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
    case 'buffer-decoder':
      return createBufferDecoderProcessor(stage);
    case 'flatten-fields':
      return createFlattenFieldsProcessor(stage as any);
    case 'merge-records':
      return createMergeRecordsProcessor(stage);
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
        console.log(`\n[DEBUG] ===== Processing Stage: ${stage.name} =====`);
        const processor = createProcessor(stage);
        result = await processor.transform(result);
        console.log(`[DEBUG] ===== Stage Complete =====\n`);
      }
      return result;
    },
  };
}
