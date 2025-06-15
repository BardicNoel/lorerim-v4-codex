import { initDebugLog, closeDebugLog, debugLog } from "./utils/debugUtils";
import { Config, loadConfig, validateConfig } from "./config";
import { stats, processPlugin } from "./pluginProcessor";
import { ParsedRecord } from "./types";
import * as path from "path";
import * as fs from "fs/promises";
import { getEnabledPlugins } from "./utils/modUtils";
import { createFileWriter } from "./utils/fileWriter";
import { RecordAggregator } from "./aggregator";

function printHeader(text: string): void {
  console.log("\n" + "=".repeat(80));
  console.log(text);
  console.log("=".repeat(80) + "\n");
}

function printSubHeader(text: string): void {
  console.log("\n" + "-".repeat(80));
  console.log(text);
  console.log("-".repeat(80));
}

export async function main(
  configPath?: string,
  debug: boolean = false
): Promise<void> {
  try {
    // Initialize debug logging if enabled
    if (debug) {
      const logPath = path.join(process.cwd(), "debug.log");
      initDebugLog(logPath);
      console.log(`Debug logging enabled. Log file: ${logPath}`);
    }

    // Load and validate configuration
    const config = await loadConfig(configPath);
    const errors = validateConfig(config);
    if (errors.length > 0) {
      throw new Error(`Configuration errors:\n${errors.join("\n")}`);
    }

    // Process plugins
    const plugins = await getEnabledPlugins(config.modDirPath);
    const aggregator = new RecordAggregator({ plugins });

    printHeader("Processing Plugins");
    for (const plugin of plugins) {
      console.log(`Processing ${plugin.name}...`);

      // Read plugin file into buffer
      const buffer = await fs.readFile(plugin.fullPath);

      // Process the plugin
      const records = await processPlugin(buffer, plugin.name);

      // Process records through aggregator
      for (const typeRecords of Object.values(records)) {
        aggregator.processPluginRecords(plugin.index, typeRecords);
      }
    }

    // Get aggregated results
    const result = aggregator.getResult();
    const recordsByType: Record<string, ParsedRecord[]> = {};

    // Group records by type
    for (const record of result.records) {
      // This is only writing the latest copy of each record
      const type = record.meta.type;
      if (!recordsByType[type]) {
        recordsByType[type] = [];
      }
      recordsByType[type].push(record);
    }

    // Write output files
    printHeader("Writing Output Files");
    const fileWriter = createFileWriter();
    await fileWriter.writeRecords(recordsByType, config.outputPath);

    // Create final stats from aggregated records
    const finalStats = {
      totalRecords: result.records.length,
      recordsByType: Object.fromEntries(
        Object.entries(recordsByType).map(([type, records]) => [
          type,
          records.length,
        ])
      ),
      skippedRecords: stats.getStats().skippedRecords,
      skippedTypes: stats.getStats().skippedTypes,
      totalBytes: stats.getStats().totalBytes,
      processingTime: stats.getStats().processingTime,
      pluginsProcessed: plugins.length,
      errors: stats.getStats().errors,
    };
    await fileWriter.writeStats(finalStats, config.outputPath);

    console.log(`Successfully processed ${plugins.length} plugins`);
    console.log(
      `Found records of types: ${Object.keys(recordsByType).join(", ")}`
    );

    // Display stats at the end
    console.log("\nProcessing complete. Stats:");
    console.log(`  Total Records: ${finalStats.totalRecords}`);
    console.log(
      `  Total Bytes: ${(finalStats.totalBytes / 1024 / 1024).toFixed(2)} MB`
    );
    console.log(
      `  Processing Time: ${(finalStats.processingTime / 1000).toFixed(2)}s`
    );
    console.log(`  Plugins Processed: ${finalStats.pluginsProcessed}`);
    console.log("\nRecords by Type:");
    Object.entries(finalStats.recordsByType)
      .sort(([, a], [, b]) => b - a)
      .forEach(([type, count]) => {
        console.log(`  ${type}: ${count}`);
      });

    // Close debug log
    closeDebugLog();
  } catch (error) {
    console.error(
      "Error:",
      error instanceof Error ? error.message : String(error)
    );
    process.exit(1);
  }
}

// Only run if this file is being executed directly
if (require.main === module) {
  main();
}
