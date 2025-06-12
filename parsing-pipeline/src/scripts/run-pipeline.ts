import { existsSync } from 'fs';
import * as path from 'path';
import { PipelineConfig, StageConfig } from '../types/pipeline';
import { createPipeline } from '../processors/core';
import { readJsonFile, writeJsonFile } from '../utils/file';
import { loadPipelineConfig } from '../utils/yaml-loader';

async function runPipelineFromConfig(configPath: string) {
    try {
        // Load pipeline configuration with imports
        const pipelineConfig = loadPipelineConfig(configPath);

        console.log(`\n=== Running Pipeline: ${pipelineConfig.name} ===`);
        if (pipelineConfig.description) {
            console.log(`Description: ${pipelineConfig.description}`);
        }
        console.log(`Input: ${pipelineConfig.input}`);
        console.log(`Output: ${pipelineConfig.output}`);
        console.log(`Stages: ${pipelineConfig.stages.length}\n`);

        // Check if input file exists
        if (!existsSync(pipelineConfig.input)) {
            throw new Error(`Input file not found: ${pipelineConfig.input}`);
        }

        // Load all stage configurations
        const stages: StageConfig[] = [];
        for (const stage of pipelineConfig.stages) {
            if (stage.enabled === false) {
                console.log(`Skipping disabled stage: ${stage.name}`);
                continue;
            }

            console.log(`Loaded stage: ${stage.name}`);
            if (stage.description) {
                console.log(`Description: ${stage.description}`);
            }
            stages.push(stage);
        }

        // Create and run pipeline
        const pipeline = createPipeline(stages);

        // Read input data
        console.log('\nReading input file...');
        const data = await readJsonFile(pipelineConfig.input);
        console.log(`Read ${data.length} records`);

        // Process data
        console.log('\nProcessing data...');
        const result = await pipeline.transform(data);

        // Write output
        console.log('\nWriting output file...');
        await writeJsonFile(pipelineConfig.output, result);
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

// Get config file path from command line arguments
const configPath = process.argv[2];
if (!configPath) {
    console.error('Usage: npm run pipeline -- <pipeline-config-file>');
    process.exit(1);
}

// Run the pipeline
runPipelineFromConfig(configPath); 