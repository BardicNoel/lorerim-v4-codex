import { promises as fs } from 'fs';
import path from 'path';
import { loadConfig, validateConfig } from './config';
import { ThreadManager } from './thread/threadManager';
import { ParsedRecord } from './types';
import { PluginMeta } from './types';
import { resolvePlugins } from './pluginResolver';
import { writeRecords } from './fileOutput';

function printHeader(text: string): void {
  console.log('\n' + '='.repeat(80));
  console.log(text);
  console.log('='.repeat(80));
}

function printSubHeader(text: string): void {
  console.log('\n' + '-'.repeat(80));
  console.log(text);
  console.log('-'.repeat(80));
}

export async function main(configPath?: string): Promise<void> {
  try {
    printHeader('SKYRIM PLUGIN PARSER');

    // Load configuration
    printSubHeader('LOADING CONFIGURATION');
    console.log(`Loading config from: ${configPath}`);
    const config = await loadConfig(configPath);
    console.log('Configuration loaded successfully:');
    console.log(`  Extracted Directory: ${config.extractedDir}`);
    console.log(`  Plugins File: ${config.pluginsTxtPath}`);
    console.log(`  Output Directory: ${config.outputDir}`);
    console.log(`  Max Threads: ${config.maxThreads}`);
    
    // Validate configuration
    printSubHeader('VALIDATING CONFIGURATION');
    const errors = validateConfig(config);
    if (errors.length > 0) {
      console.error('Configuration errors:');
      errors.forEach(error => console.error(`  - ${error}`));
      throw new Error('Configuration validation failed');
    }
    console.log('Configuration validation passed');

    // Resolve plugins
    printSubHeader('RESOLVING PLUGINS');
    console.log(`Reading plugins from: ${config.pluginsTxtPath}`);
    const plugins = await resolvePlugins(config.pluginsTxtPath, config.extractedDir);
    console.log(`Found ${plugins.length} plugins to process:`);
    plugins.forEach(plugin => console.log(`  - ${plugin.name} (${plugin.fullPath})`));

    // Create a map to store records by type
    const recordsByType = new Map<string, ParsedRecord[]>();

    // Initialize thread manager
    printSubHeader('INITIALIZING THREAD MANAGER');
    console.log(`Starting with ${config.maxThreads} worker threads`);
    const threadManager = new ThreadManager(config.maxThreads, (record: ParsedRecord) => {
      // Group records by type
      if (!recordsByType.has(record.meta.type)) {
        recordsByType.set(record.meta.type, []);
      }
      recordsByType.get(record.meta.type)!.push(record);
    });

    // Process each plugin
    printSubHeader('PROCESSING PLUGINS');
    for (const plugin of plugins) {
      console.log(`\nProcessing ${plugin.name}...`);
      try {
        await threadManager.processPlugin(plugin);
        console.log(`✓ Completed ${plugin.name}`);
      } catch (error) {
        console.error(`✗ Failed to process ${plugin.name}:`, error instanceof Error ? error.message : String(error));
        throw error; // Re-throw to stop processing
      }
    }

    // Shutdown thread manager
    printSubHeader('SHUTTING DOWN');
    console.log('Shutting down thread manager...');
    await threadManager.shutdown();
    console.log('Thread manager shutdown complete');

    // Output records by type
    printSubHeader('WRITING OUTPUT');
    for (const [type, records] of recordsByType) {
      console.log(`Writing ${records.length} ${type} records...`);
      // TODO: Write records to output files
    }

    printHeader('PROCESSING COMPLETE');
    console.log(`Successfully processed ${plugins.length} plugins`);
    console.log(`Found records of types: ${Array.from(recordsByType.keys()).join(', ')}`);

  } catch (error: unknown) {
    printHeader('PROCESSING FAILED');
    console.error('Error:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

// Only run if this file is being executed directly
if (require.main === module) {
  main();
} 