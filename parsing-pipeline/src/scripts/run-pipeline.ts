import { existsSync } from 'fs';
import * as path from 'path';
import { PipelineConfig, StageConfig } from '../types/pipeline';
import { createPipeline } from '../processors/core';
import { readJsonFile } from '../utils/file';
import { loadPipelineConfig } from '../utils/yaml-loader';
import { writeJsonFile } from '@lorerim/platform-types';

async function runPipelineFromConfig(configPath: string) {
    try {
        console.log('\n[DEBUG] ===== Starting Pipeline Config Load =====');
        console.log(`[DEBUG] Config path: ${configPath}`);
        console.log(`[DEBUG] Current working directory: ${process.cwd()}`);
        
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
        const inputPath = path.resolve(pipelineConfig.input);
        console.log(`[DEBUG] Checking input file: ${inputPath}`);
        if (!existsSync(inputPath)) {
            console.error(`[ERROR] Input file not found at: ${inputPath}`);
            console.error(`[DEBUG] Relative path was: ${pipelineConfig.input}`);
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
            console.log(`[DEBUG] Stage type: ${stage.type}`);
            stages.push(stage);
        }

        // Create and run pipeline
        console.log('\n[DEBUG] Creating pipeline with stages...');
        const pipeline = createPipeline(stages);

        // Read input data
        console.log('\nReading input file...');
        console.log(`[DEBUG] Reading from: ${inputPath}`);
        const data = await readJsonFile(inputPath);
        console.log(`Read ${data.length} records`);

        // Process data
        console.log('\nProcessing data...');
        const result = await pipeline.transform(data);

        // Write output
        const outputPath = path.resolve(pipelineConfig.output);
        console.log('\nWriting output file...');
        console.log(`[DEBUG] Writing to: ${outputPath}`);
        await writeJsonFile(outputPath, result);
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
        if (error instanceof Error && error.stack) {
            console.error('\n[DEBUG] Stack trace:');
            console.error(error.stack);
        }
        throw error;
    }
}

// Get config file path from command line arguments
let configPath: string | undefined;
console.log('[DEBUG] Processing command line arguments:', process.argv.slice(2));
for (let i = 2; i < process.argv.length; i++) {
    if (process.argv[i] === '--config' && i + 1 < process.argv.length) {
        configPath = process.argv[i + 1];
        console.log(`[DEBUG] Found --config argument: ${configPath}`);
        break;
    } else if (!process.argv[i].startsWith('--')) {
        configPath = process.argv[i];
        console.log(`[DEBUG] Found direct path argument: ${configPath}`);
        break;
    }
}

if (!configPath) {
    console.error('Usage: npm run pipeline -- [--config] <pipeline-config-file>');
    process.exit(1);
}

// Run the pipeline
runPipelineFromConfig(configPath); 