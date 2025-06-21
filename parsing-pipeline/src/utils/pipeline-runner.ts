import { PipelineConfig } from '../types/pipeline';
import { createPipeline } from '../processors/core';
import { readJsonFile } from './file';
import { writeJsonFile } from '@lorerim/platform-types';

export async function runPipeline(config: PipelineConfig): Promise<void> {
  console.log(`\n=== Running Pipeline ===`);
  console.log(`Input: ${config.input}`);
  console.log(`Output: ${config.output}`);
  console.log(`Stages: ${config.stages.length}`);

  try {
    // Create pipeline
    const pipeline = createPipeline(config.stages, config.input);

    // Read input data
    console.log('\nReading input file...');
    const data = await readJsonFile(config.input);
    console.log(`Read ${data.length} records`);

    // Process data
    console.log('\nProcessing data...');
    const result = await pipeline.transform(data);

    // Write output
    console.log('\nWriting output file...');
    await writeJsonFile(config.output, result);
    console.log(`Wrote ${result.length} records`);

    // Get and display stats if available
    const stats = pipeline.getStats?.();
    if (stats) {
      console.log('\nProcessing Statistics:');
      Object.entries(stats).forEach(([key, value]) => {
        if (typeof value === 'number') {
          console.log(`${key}: ${value}`);
        }
      });
    }

    console.log('\nPipeline completed successfully!');
  } catch (error) {
    console.error('\nPipeline failed:', error instanceof Error ? error.message : String(error));
    throw error;
  }
}

// Example usage:
// import { cleanupPipeline } from '../config/example-pipeline';
// await runPipeline(cleanupPipeline);
