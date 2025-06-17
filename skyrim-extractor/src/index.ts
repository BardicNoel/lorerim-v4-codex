import { initDebugLog, closeDebugLog, debugLog } from "./utils/debugUtils";
import { loadConfig, validateConfig } from "./config";
import * as path from "path";
import { getEnabledPlugins } from "./utils/modUtils";
import { runPluginScan } from "./refactor/runPluginScan";
import {
  reportGrupDistribution,
  reportParsedRecords,
  reportPluginSummaries,
  reportRecordTypeDistribution,
} from "./refactor/runReports";
import { createFileWriter } from "./utils/fileWriter";

export function parseArgs(): {
  configPath: string | undefined;
  debug: boolean;
} {
  const args = process.argv.slice(2);
  let configPath: string | undefined;
  let debug = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--config" && i + 1 < args.length) {
      configPath = args[i + 1];
    } else if (args[i] === "--debug") {
      debug = true;
    }
  }

  return { configPath, debug };
}

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
    const plugins = await getEnabledPlugins(
      config.modDirPath,
      config.baseGameDir,
      config.baseGameFiles
    );

    printHeader("Processing Plugins");
    console.log(`Found ${plugins.length} plugins to process\n`);

    // Process plugins using the new scanning system
    const { bufferMetas: results, parsedRecordDict } = await runPluginScan(
      plugins,
      {
        maxThreads: Math.max(1, Math.min(4, plugins.length)),
        debug,
        onLog: (message) => {
          if (debug) {
            debugLog(message);
          }
          console.log(message);
        },
        recordTypeFilter: config.recordTypeFilter,
      }
    );

    const endTime = Date.now();
    const processingTime = endTime - startTime;

    printHeader("Processing Complete");

    // Print basic stats
    printSubHeader("Basic Statistics");
    console.log(`Total Records: ${results.length.toLocaleString()}`);
    console.log(
      `Total Bytes: ${(
        results.reduce((sum, r) => sum + r.size, 0) /
        1024 /
        1024
      ).toFixed(2)} MB`
    );
    console.log(`Processing Time: ${(processingTime / 1000).toFixed(2)}s`);
    console.log(`Plugins Processed: ${plugins.length}`);

    // Generate reports
    // reportPluginSummaries(results);
    // reportGrupDistribution(results);
    reportRecordTypeDistribution(results);
    reportParsedRecords(parsedRecordDict);

    // Write parsed records to files
    printSubHeader("Writing Records to Files");
    const fileWriter = createFileWriter();
    const outputDir = path.resolve(config.outputPath);
    await fileWriter.writeRecords(parsedRecordDict, outputDir);
    console.log(`Records written to: ${outputDir}`);

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
  const { configPath, debug } = parseArgs();
  if (!configPath) {
    console.error(
      "Error: No config file specified. Please provide a config file with --config path/to/config.json"
    );
    process.exit(1);
  }
  main(configPath, debug).catch((error: unknown) => {
    console.error(
      "Fatal error:",
      error instanceof Error ? error.message : String(error)
    );
    process.exit(1);
  });
}
