import { initDebugLog, closeDebugLog, debugLog } from './utils/debugUtils';
import { Config, loadConfig, validateConfig } from './config';
import { stats, processPlugin } from './pluginProcessor';
import { ParsedRecord } from './types';
import * as path from 'path';
import * as fs from 'fs/promises';
import { getEnabledPlugins } from './utils/modUtils';

function printHeader(text: string): void {
  console.log('\n' + '='.repeat(80));
  console.log(text);
  console.log('='.repeat(80) + '\n');
}

function printSubHeader(text: string): void {
  console.log('\n' + '-'.repeat(80));
  console.log(text);
  console.log('-'.repeat(80));
}

export async function main(configPath?: string): Promise<void> {
  try {
    // Initialize debug logging
    const debugLogPath = path.join(process.cwd(), 'debug.log');
    initDebugLog(debugLogPath);

    // Load and validate configuration
    const config = await loadConfig(configPath);
    const errors = validateConfig(config);
    if (errors.length > 0) {
      throw new Error(`Configuration errors:\n${errors.join('\n')}`);
    }

    // Process plugins
    const plugins = await getEnabledPlugins(config.modDirPath);
    const recordsByType = new Map<string, ParsedRecord[]>();

    printHeader('Processing Plugins');
    for (const plugin of plugins) {
      console.log(`Processing ${plugin.name}...`);
      
      // Read plugin file into buffer
      const buffer = await fs.readFile(plugin.fullPath);
      
      // Process the plugin
      const records = await processPlugin(buffer, plugin.name);
      
      // Merge records by type
      for (const [type, typeRecords] of Object.entries(records)) {
        if (!recordsByType.has(type)) {
          recordsByType.set(type, []);
        }
        recordsByType.get(type)!.push(...typeRecords);
      }
    }

    // Write output files
    printHeader('Writing Output Files');
    for (const [type, records] of recordsByType) {
      const outputPath = path.join(config.outputPath, `${type}.json`);
      await fs.writeFile(outputPath, JSON.stringify(records, null, 2));
      console.log(`Wrote ${records.length} ${type} records to ${outputPath}`);
    }

    console.log(`Successfully processed ${plugins.length} plugins`);
    console.log(`Found records of types: ${Array.from(recordsByType.keys()).join(', ')}`);

    // Display stats at the end
    console.log('\n' + stats.formatStats());

    // Close debug log
    closeDebugLog();
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

// Only run if this file is being executed directly
if (require.main === module) {
  main();
} 