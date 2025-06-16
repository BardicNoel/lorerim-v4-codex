import { initDebugLog, closeDebugLog, debugLog } from "./utils/debugUtils";
import { loadConfig, validateConfig } from "./config";
import * as path from "path";
import { getEnabledPlugins } from "./utils/modUtils";
import { createThreadManager } from "./thread/threadManager";

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
    const startTime = Date.now();

    // Initialize debug logging if enabled
    if (debug) {
      const logPath = path.join(process.cwd(), "debug.log");
      initDebugLog(logPath);
      debugLog(`Debug logging enabled. Log file: ${logPath}`);
    }

    // Load and validate configuration
    const config = await loadConfig(configPath);
    const errors = validateConfig(config);
    if (errors.length > 0) {
      throw new Error(`Configuration errors:\n${errors.join("\n")}`);
    }

    // Process plugins
    const plugins = await getEnabledPlugins(config.modDirPath);

    printHeader("Processing Plugins");
    console.log(`Found ${plugins.length} plugins to process\n`);

    // Create thread manager and process plugins in parallel
    const threadManager = createThreadManager();
    await threadManager.processPlugins(plugins, config.outputPath, debug);

    // Get stats from thread manager
    const stats = threadManager.getStats();

    console.log("\nProcessing complete. Stats:");
    console.log(`  Total Records: ${stats.totalRecords}`);
    console.log(
      `  Total Bytes: ${(stats.totalBytes / 1024 / 1024).toFixed(2)} MB`
    );
    console.log(
      `  Processing Time: ${(stats.processingTime / 1000).toFixed(2)}s`
    );
    console.log(`  Plugins Processed: ${stats.pluginsProcessed}\n`);

    // Records by type
    console.log("Records by Type:");
    Object.entries(stats.recordsByType)
      .sort(([, a], [, b]) => b - a)
      .forEach(([type, count]) => {
        console.log(`  ${type}: ${count} records`);
      });

    // Show skipped records if any
    if (stats.skippedRecords > 0) {
      console.log("\nSkipped Records:");
      console.log(`  Total Skipped: ${stats.skippedRecords}`);
      console.log(
        `  Skipped Types: ${Array.from(stats.skippedTypes).join(", ")}`
      );
    }

    // Show errors if any
    if (stats.errors.count > 0) {
      console.log("\nErrors:");
      console.log(`  Total Errors: ${stats.errors.count}`);
      Object.entries(stats.errors.types)
        .sort(([, a], [, b]) => b - a)
        .forEach(([type, count]) => {
          console.log(`  ${type}: ${count} errors`);
        });
    }

    // Clear the aggregator after all stats have been reported
    threadManager.getStats(); // This ensures we have the latest stats
    threadManager.clear();

    // Close debug log if enabled
    if (debug) {
      await closeDebugLog();
    }
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

// Only run if this file is being executed directly
if (require.main === module) {
  main();
}
