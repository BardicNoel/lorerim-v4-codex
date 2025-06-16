/**
 * Stats collector for tracking processing metrics
 */
export interface ProcessingStats {
  totalRecords: number;
  recordsByType: Record<string, number>;
  skippedRecords: number;
  skippedTypes: Set<string>;
  totalBytes: number;
  processingTime: number;
  pluginsProcessed: number;
  errors: {
    count: number;
    types: Record<string, number>;
  };
}

export class StatsCollector {
  private stats: ProcessingStats;
  private startTime: number;

  constructor() {
    this.stats = {
      totalRecords: 0,
      recordsByType: {},
      skippedRecords: 0,
      skippedTypes: new Set(),
      totalBytes: 0,
      processingTime: 0,
      pluginsProcessed: 0,
      errors: {
        count: 0,
        types: {},
      },
    };
    this.startTime = Date.now();
  }

  /**
   * Record a processed record
   */
  recordProcessed(type: string, size: number): void {
    this.stats.totalRecords++;
    this.stats.totalBytes += size;
    this.stats.recordsByType[type] = (this.stats.recordsByType[type] || 0) + 1;
  }

  /**
   * Record a skipped record
   */
  recordSkipped(type: string, size: number): void {
    this.stats.skippedRecords++;
    this.stats.skippedTypes.add(type);
    this.stats.totalBytes += size;
  }

  /**
   * Record a plugin being processed
   */
  recordPluginProcessed(): void {
    this.stats.pluginsProcessed++;
  }

  /**
   * Record an error
   */
  recordError(errorType: string): void {
    this.stats.errors.count++;
    this.stats.errors.types[errorType] =
      (this.stats.errors.types[errorType] || 0) + 1;
  }

  /**
   * Get the current stats
   */
  getStats(): ProcessingStats {
    this.stats.processingTime = Date.now() - this.startTime;
    return { ...this.stats };
  }

  /**
   * Format stats for display
   */
  formatStats(): string {
    const stats = this.getStats();
    const lines: string[] = [];

    // Basic stats
    lines.push(`Processing complete. Stats:`);
    lines.push(`  Total Records: ${stats.totalRecords}`);
    lines.push(
      `  Total Bytes: ${(stats.totalBytes / 1024 / 1024).toFixed(2)} MB`
    );
    lines.push(
      `  Processing Time: ${(stats.processingTime / 1000).toFixed(2)}s`
    );
    lines.push(`  Plugins Processed: ${stats.pluginsProcessed}`);

    // Records by type
    lines.push(`\nRecords by Type:`);
    Object.entries(stats.recordsByType)
      .sort(([, a], [, b]) => b - a)
      .forEach(([type, count]) => {
        lines.push(`  ${type}: ${count}`);
      });

    // Skipped records
    if (stats.skippedRecords > 0) {
      lines.push(`\nSkipped Records: ${stats.skippedRecords}`);
      lines.push(`Skipped Types: ${Array.from(stats.skippedTypes).join(", ")}`);
    }

    // Errors
    if (stats.errors.count > 0) {
      lines.push(`\nErrors:`);
      lines.push(`  Total Errors: ${stats.errors.count}`);
      Object.entries(stats.errors.types)
        .sort(([, a], [, b]) => b - a)
        .forEach(([type, count]) => {
          lines.push(`  ${type}: ${count}`);
        });
    }

    return lines.join("\n");
  }
}
