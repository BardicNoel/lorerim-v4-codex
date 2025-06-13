import { promises as fs } from 'fs';
import path from 'path';
import { loadConfig, validateConfig } from './config';
import { ThreadManager } from './thread/threadManager';
import { ParsedRecord } from './types';
import { PluginMeta } from './types';
import { getEnabledPlugins } from './utils/modUtils';
import { writeRecords } from './fileOutput';
import { initDebugLog, closeDebugLog, debugLog } from './utils/debugUtils';

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
    console.log(`  Mod Directory: ${config.modDirPath}`);
    console.log(`  Output Directory: ${config.outputPath}`);
    console.log(`  Max Threads: ${config.maxThreads}`);
    
    // Initialize debug logging
    initDebugLog(config.outputPath);
    debugLog('Debug logging initialized');
    
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
    console.log(`Reading plugins from mod directory: ${config.modDirPath}`);
    const plugins = await getEnabledPlugins(config.modDirPath);
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
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`✗ Failed to process ${plugin.name}: ${errorMessage}`);
        if (error instanceof Error && error.stack) {
          console.error('Stack trace:', error.stack);
        }
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
      await writeRecords(records, config.outputPath);
    }

    printHeader('PROCESSING COMPLETE');
    console.log(`Successfully processed ${plugins.length} plugins`);
    console.log(`Found records of types: ${Array.from(recordsByType.keys()).join(', ')}`);

    // Close debug log
    closeDebugLog();

  } catch (error: unknown) {
    printHeader('PROCESSING FAILED');
    console.error('Error:', error instanceof Error ? error.message : String(error));
    closeDebugLog();
    process.exit(1);
  }
}

// Only run if this file is being executed directly
if (require.main === module) {
  main();
} 