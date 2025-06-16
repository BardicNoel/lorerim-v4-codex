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

    printHeader("Processing Complete");

    // Basic stats
    printSubHeader("Basic Statistics");
    console.log(`Total Records: ${stats.totalRecords.toLocaleString()}`);
    console.log(
      `Total Bytes: ${(stats.totalBytes / 1024 / 1024).toFixed(2)} MB`
    );
    console.log(
      `Processing Time: ${(stats.processingTime / 1000).toFixed(2)}s`
    );
    console.log(`Plugins Processed: ${stats.pluginsProcessed}`);

    // Records by type with percentages
    printSubHeader("Records by Type");
    const totalRecords = stats.totalRecords;
    Object.entries(stats.recordsByType)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .forEach(([type, count]) => {
        const percentage = (((count as number) / totalRecords) * 100).toFixed(
          1
        );
        console.log(
          `  ${type}: ${(
            count as number
          ).toLocaleString()} records (${percentage}%)`
        );
      });

    // Skipped records with details
    if (stats.skippedRecords > 0) {
      printSubHeader("Skipped Records");
      console.log(`Total Skipped: ${stats.skippedRecords.toLocaleString()}`);
      console.log(
        `Skipped Types: ${Array.from(stats.skippedTypes).join(", ")}`
      );

      // Show skipped records by type if available
      if (stats.skippedByType) {
        console.log("\nSkipped Records by Type:");
        Object.entries(stats.skippedByType)
          .sort(([, a], [, b]) => (b as number) - (a as number))
          .forEach(([type, count]) => {
            console.log(
              `  ${type}: ${(count as number).toLocaleString()} records`
            );
          });
      }
    }

    // Error statistics
    if (stats.errors.count > 0) {
      printSubHeader("Error Statistics");
      console.log(`Total Errors: ${stats.errors.count.toLocaleString()}`);
      console.log("\nErrors by Type:");
      Object.entries(stats.errors.types)
        .sort(([, a], [, b]) => (b as number) - (a as number))
        .forEach(([type, count]) => {
          console.log(
            `  ${type}: ${(count as number).toLocaleString()} errors`
          );
        });
    }

    // Performance metrics
    printSubHeader("Performance Metrics");
    const recordsPerSecond = (
      stats.totalRecords /
      (stats.processingTime / 1000)
    ).toFixed(2);
    const mbPerSecond = (
      stats.totalBytes /
      1024 /
      1024 /
      (stats.processingTime / 1000)
    ).toFixed(2);
    console.log(`Processing Rate: ${recordsPerSecond} records/second`);
    console.log(`Data Rate: ${mbPerSecond} MB/second`);
    console.log(
      `Average Records per Plugin: ${(
        stats.totalRecords / stats.pluginsProcessed
      ).toFixed(2)}`
    );

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
