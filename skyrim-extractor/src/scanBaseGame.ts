import { initDebugLog, closeDebugLog, debugLog } from "./utils/debugUtils";
import { loadConfig, validateConfig } from "./config";
import * as path from "path";
import { getEnabledPlugins } from "./utils/modUtils";
import { runPluginScan } from "./refactor/runPluginScan";
import { createFileWriter } from "./utils/fileWriter";
import { StatsReporter } from "./utils/statsReporter";

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

function printHeader(title: string): void {
  console.log("\n" + "=".repeat(80));
  console.log(title);
  console.log("=".repeat(80) + "\n");
}

function printSubHeader(title: string): void {
  console.log("\n" + "-".repeat(80));
  console.log(title);
  console.log("-".repeat(80) + "\n");
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

    // Get base game plugins
    const plugins = await getEnabledPlugins(
      config.modDirPath,
      config.baseGameDir,
      ["Skyrim.esm"] // Only scan Skyrim.esm
    );

    printHeader("Processing Skyrim.esm");
    console.log(`Found ${plugins.length} plugins to process\n`);

    // Process plugins using the scanning system
    const {
      bufferMetas: results,
      parsedRecordDict,
      stats,
    } = await runPluginScan(plugins, {
      maxThreads: 1, // Single thread for debugging
      debug,
      onLog: (message) => {
        if (debug) {
          debugLog(message);
        }
        console.log(message);
      },
      recordTypeFilter: config.recordTypeFilter,
    });

    const endTime = Date.now();
    const processingTime = endTime - startTime;

    printHeader("Processing Complete");

    // Generate report file
    const reportPath = path.join(config.outputPath, "skyrim-stats.json");
    StatsReporter.generateReportFile(stats, reportPath);
    console.log(`\nDetailed report saved to: ${reportPath}`);

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

    // Write parsed records to JSON files by type
    printSubHeader("Writing Record Files");
    const recordsDir = path.join(config.outputPath, "skyrim-records");
    const fileWriter = createFileWriter();
    await fileWriter.writeRecords(parsedRecordDict, recordsDir);
    console.log(`\nRecords written to: ${recordsDir}`);
  } catch (error) {
    console.error(
      "Error:",
      error instanceof Error ? error.message : String(error)
    );
    process.exit(1);
  } finally {
    if (debug) {
      closeDebugLog();
    }
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
