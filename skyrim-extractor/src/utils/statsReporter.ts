import { ProcessingStats } from "./statsCollector";

export class StatsReporter {
  static report(stats: ProcessingStats): void {
    console.log("\n=== Processing Statistics ===\n");

    // Overall stats
    console.log("Overall Statistics:");
    console.log(`Total Records: ${stats.totalRecords.toLocaleString()}`);
    console.log(
      `Processed Records: ${stats.processedRecords.toLocaleString()}`
    );
    console.log(
      `Skipped Records: ${stats.skippedRecords.total.toLocaleString()}`
    );
    console.log(`Errors: ${stats.errors.total.toLocaleString()}\n`);

    // Skipped records by type
    if (stats.skippedRecords.total > 0) {
      console.log("Skipped Records by Type:");
      Object.entries(stats.skippedRecords.byType)
        .sort(([, a], [, b]) => b - a)
        .forEach(([type, count]) => {
          console.log(`  ${type}: ${count.toLocaleString()}`);
        });
      console.log();
    }

    // Errors by type
    if (stats.errors.total > 0) {
      console.log("Errors by Type:");
      Object.entries(stats.errors.byType)
        .sort(([, a], [, b]) => b - a)
        .forEach(([type, count]) => {
          console.log(`  ${type}: ${count.toLocaleString()}`);
        });
      console.log();

      // Detailed error report
      console.log("Detailed Error Report:");
      stats.errors.details.forEach((error) => {
        console.log(`  Plugin: ${error.plugin}`);
        console.log(`  Type: ${error.type}`);
        if (error.recordId) {
          console.log(`  Record ID: ${error.recordId}`);
        }
        console.log(`  Message: ${error.message}`);
        console.log();
      });
    }

    // Plugin statistics
    console.log("Plugin Statistics:");
    Object.entries(stats.plugins)
      .sort(([, a], [, b]) => b.processed - a.processed)
      .forEach(([plugin, pluginStats]) => {
        console.log(`\n${plugin}:`);
        console.log(`  Processed: ${pluginStats.processed.toLocaleString()}`);
        console.log(`  Skipped: ${pluginStats.skipped.toLocaleString()}`);
        console.log(`  Errors: ${pluginStats.errors.toLocaleString()}`);
      });
  }

  static generateReportFile(stats: ProcessingStats, outputPath: string): void {
    const report = {
      summary: {
        totalRecords: stats.totalRecords,
        processedRecords: stats.processedRecords,
        skippedRecords: stats.skippedRecords.total,
        errors: stats.errors.total,
      },
      skippedRecords: stats.skippedRecords.byType,
      errors: {
        byType: stats.errors.byType,
        details: stats.errors.details,
      },
      plugins: stats.plugins,
    };

    // Write to file
    const fs = require("fs");
    fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
  }
}
