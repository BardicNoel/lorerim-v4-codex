import { JsonArray, StageConfig, ProcessingResult } from '../../types/pipeline';
import { createFilterRecordsProcessor } from './filter-records';
import { createKeepFieldsProcessor } from './keep-fields';
import { createSanitizeFieldsProcessor } from './sanitize-fields';
import { createBufferDecoderProcessor } from '../buffer-decoder/parser';
import { formatJSON } from '@lorerim/platform-types';
import { createFlattenFieldsProcessor } from './flatten-fields';
import { createMergeRecordsProcessor } from './merge-records';
import { createRenameFieldsProcessor } from './rename-fields';
import { createSampleRecordsProcessor } from './sample-records';
import { removeFieldsProcessorV2 } from './remove-fields-v2';
import { createDocGenProcessor } from '../doc-gen/doc-gen';
import { createExtractFieldProcessor } from './extract-field';
import { createFormIdResolverProcessor } from './formid-resolver';

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
    case 'rename-fields':
      return createRenameFieldsProcessor(stage as any);
    case 'sample-records':
      return createSampleRecordsProcessor(stage);
    case 'doc-gen':
      return createDocGenProcessor(stage);
    case 'extract-field':
      return createExtractFieldProcessor(stage as any);
    case 'formid-resolver':
      return createFormIdResolverProcessor(stage as any);
    default:
      throw new Error(`Unknown stage type: ${(stage as any).type}`);
  }
}

function createRemoveFieldsProcessor(stage: StageConfig) {
  let removeFields: string[] = [];

  // Handle new format: remove_fields array
  if ((stage as any).remove_fields) {
    removeFields = (stage as any).remove_fields;
  }
  // Handle old format: fields object with 'all' values
  else if ((stage as any).fields) {
    const fields = (stage as any).fields;
    if (typeof fields === 'object') {
      // Convert fields with 'all' values to field paths
      Object.keys(fields).forEach((fieldPath) => {
        if (fields[fieldPath] === 'all') {
          removeFields.push(fieldPath);
        }
      });
    }
  }

  const config = {
    remove_fields: removeFields,
    condition: (stage as any).condition,
  };

  return {
    transform: (data: any[]) => Promise.resolve(removeFieldsProcessorV2.process(data, config)),
    getStats: () => ({}),
  };
}

// Create a pipeline from multiple stages
export function createPipeline(stages: StageConfig[], inputFilePath?: string): Processor {
  return {
    transform: async (data: JsonArray) => {
      let result = data;
      for (const stage of stages) {
        console.log(`\n[DEBUG] ===== Processing Stage: ${stage.name} =====`);

        // Add input file path to buffer decoder config if available
        if (stage.type === 'buffer-decoder' && inputFilePath) {
          (stage as any).inputFilePath = inputFilePath;
        }

        const processor = createProcessor(stage);
        result = await processor.transform(result);
        console.log(`[DEBUG] ===== Stage Complete =====\n`);
      }
      return result;
    },
  };
}
