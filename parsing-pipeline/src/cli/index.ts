import { Command } from 'commander';
import { Processor, createProcessor } from '../processors/core';
import { processFile } from '../utils/file-processing';
import { StageConfig } from '../types/pipeline';

// CLI command handlers
async function runPipeline(options: any): Promise<void> {
  try {
    // Parse stages from JSON string
    const stages: StageConfig[] = JSON.parse(options.stages);
    
    // Create pipeline from stages
    const pipeline = {
      transform: async (data: any) => {
        let result = data;
        for (const stage of stages) {
          const processor = createProcessor(stage);
          result = await processor.transform(result);
        }
        return result;
      }
    };

    const result = await processFile(pipeline, options.input, options.output);
    console.log(`Pipeline completed. Processed ${result.recordsProcessed} records.`);
  } catch (error) {
    console.error('Pipeline failed:', error);
    process.exit(1);
  }
}

// CLI setup
const program = new Command();

program
  .name('parsing-pipeline')
  .description('JSON processing pipeline with functional processors')
  .version('1.0.0');

program
  .command('run')
  .description('Run a processing pipeline')
  .requiredOption('-i, --input <path>', 'Input file path')
  .requiredOption('-o, --output <path>', 'Output file path')
  .requiredOption('-s, --stages <stages>', 'Pipeline stages in JSON format')
  .action(runPipeline);

// Example usage:
// parsing-pipeline run -i input.json -o output.json -s '[{"type":"filter-records","conditions":[{"field":"status","operator":"equals","value":"active"}]}]'

export { program }; 