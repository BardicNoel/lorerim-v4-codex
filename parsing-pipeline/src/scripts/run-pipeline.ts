import { readFileSync, existsSync } from 'fs';
import { parse } from 'yaml';
import * as path from 'path';
import { PipelineConfig, StageConfig } from '../types/pipeline';
import { createPipeline } from '../processors/core';
import { readJsonFile, writeJsonFile } from '../utils/file';

async function loadStageConfig(configPath: string): Promise<StageConfig> {
    if (!existsSync(configPath)) {
        throw new Error(`Stage configuration file not found: ${configPath}`);
    }

    const fileContents = readFileSync(configPath, 'utf8');
    const config = parse(fileContents) as StageConfig;

    if (!config.name || !config.type) {
        throw new Error(`Invalid stage configuration in ${configPath}: missing required fields`);
    }

    return config;
}

async function runPipelineFromConfig(configPath: string) {
    try {
        // Check if config file exists
        if (!existsSync(configPath)) {
            throw new Error(`Pipeline configuration file not found: ${configPath}`);
        }

        // Load and parse pipeline configuration
        const fileContents = readFileSync(configPath, 'utf8');
        const pipelineConfig = parse(fileContents) as PipelineConfig;

        // Validate pipeline configuration
        if (!pipelineConfig.name || !pipelineConfig.input || !pipelineConfig.output || !pipelineConfig.stages) {
            throw new Error('Invalid pipeline configuration: missing required fields');
        }

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
        console.log(`Final output: ${pipelineConfig.output}`);

    } catch (error) {
        console.error('\nPipeline failed:', error instanceof Error ? error.message : String(error));
        process.exit(1);
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