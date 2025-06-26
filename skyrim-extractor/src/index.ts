import { initDebugLog, closeDebugLog, debugLog } from "./utils/debugUtils";
import { loadConfig, validateConfig } from "./config";
import * as path from "path";
import { getRecordFiles } from "./utils/modUtilsV2";
import { runPluginScan } from "./refactor/runPluginScan";
import {
  reportGrupDistribution,
  reportParsedRecords,
  reportPluginSummaries,
  reportRecordTypeDistribution,
  reportBufferParserValidation,
} from "./refactor/runReports";
import { createFileWriter } from "./utils/fileWriter";
import { StatsReporter } from "./utils/statsReporter";
import { mergeTypeDictionaries } from "./refactor/parsedRecordDataStructs";
import { flagWinners } from "./post-process";
import * as fs from "fs";
import { PluginMeta } from "@lorerim/platform-types";

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
    console.log("Loaded config paths:", config.paths);
    const errors = validateConfig(config);
    if (errors.length > 0) {
      throw new Error(`Configuration errors:\n${errors.join("\n")}`);
    }

    // Process plugins
    const pluginPathMap = await getRecordFiles(config);
    const plugins = Array.from(pluginPathMap.values());

    printHeader("Processing Plugins");
    console.log(`Found ${plugins.length} plugins to process\n`);

    // Process plugins using the new scanning system
    const {
      bufferMetas: results,
      parsedRecords,
      stats,
    } = await runPluginScan(plugins, {
      maxThreads: Math.max(1, Math.min(4, plugins.length)),
      debug,
      onLog: (message) => {
        if (debug) {
          debugLog(message);
        }
        console.log(message);
      },
      recordTypeFilter: config.recordTypeFilter,
    });

    console.log("Plugin Scan Complete");

    // map plugin names to PluginMeta
    const pluginRegistry = Object.fromEntries(
      plugins.map((plugin) => [plugin.name, plugin])
    );
    console.log("Plugin Registry Complete");

    const parsedRecordDict = flagWinners(
      mergeTypeDictionaries(parsedRecords),
      pluginRegistry
    );

    // We need to apply the isWinner flag to the parsedRecords

    const endTime = Date.now();
    const processingTime = endTime - startTime;

    printHeader("Processing Complete");

    // Generate report file
    const reportPath = path.join(
      config.paths.outputDir,
      "processing-stats.json"
    );
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
    console.log(`Plugins Processed: ${plugins.length}`);

    // Generate reports
    reportRecordTypeDistribution(results);
    reportBufferParserValidation(
      results,
      Object.values(parsedRecordDict).flat()
    );

    // Write parsed records to JSON files by type
    printSubHeader("Writing Record Files");
    const recordsDir = config.paths.outputDir;
    const fileWriter = createFileWriter();
    await fileWriter.writeRecords(parsedRecordDict, recordsDir);
    console.log(`\nRecords written to: ${recordsDir}`);

    // Write plugin metadata map
    printSubHeader("Writing Plugin Metadata");
    const pluginMetadataPath = path.join(recordsDir, "plugin-metadata.json");

    // Split plugins into main and esl arrays
    const allPlugins = Array.from(pluginPathMap.values());
    const mainPlugins: Partial<PluginMeta>[] = [];
    const eslPlugins: Partial<PluginMeta>[] = [];

    allPlugins.forEach((plugin) => {
      const partialPlugin: Partial<PluginMeta> = {
        name: plugin.name,
        fullPath: plugin.fullPath,
        modFolder: plugin.modFolder,
        isEsl: plugin.isEsl,
        loadOrder: plugin.loadOrder,
      };

      if (plugin.isEsl) {
        eslPlugins.push(partialPlugin);
      } else {
        mainPlugins.push(partialPlugin);
      }
    });

    const pluginMetadata = {
      main: mainPlugins,
      esl: eslPlugins,
    };

    try {
      await fs.promises.writeFile(
        pluginMetadataPath,
        JSON.stringify(pluginMetadata, null, 2),
        "utf-8"
      );
      console.log(`Plugin metadata written to: ${pluginMetadataPath}`);
      console.log(
        `Total plugins in metadata: ${mainPlugins.length} main + ${eslPlugins.length} esl = ${allPlugins.length}`
      );
    } catch (error) {
      console.error(
        `Failed to write plugin metadata: ${error instanceof Error ? error.message : String(error)}`
      );
    }

    // Also write the original plugin metadata map format
    const pluginMetadataMapPath = path.join(
      recordsDir,
      "plugin-metadata-map.json"
    );
    const pluginMetadataMap = Object.fromEntries(pluginPathMap);

    try {
      await fs.promises.writeFile(
        pluginMetadataMapPath,
        JSON.stringify(pluginMetadataMap, null, 2),
        "utf-8"
      );
      console.log(`Plugin metadata map written to: ${pluginMetadataMapPath}`);
      console.log(
        `Total plugins in metadata map: ${Object.keys(pluginMetadataMap).length}`
      );
    } catch (error) {
      console.error(
        `Failed to write plugin metadata map: ${error instanceof Error ? error.message : String(error)}`
      );
    }
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
