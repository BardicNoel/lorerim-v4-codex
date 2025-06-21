interface Stats {
  totalRecords: number;
  totalBytes: number;
  skippedRecords: number;
  skippedBytes: number;
  pluginsProcessed: number;
  recordsByType: Record<string, number>;
  skippedTypes: Set<string>;
  skippedByType: Record<string, number>;
  skippedSizeByType: Record<string, number>;
  errors: Record<string, number>;
}

export class StatsCollector {
  private stats: Stats = {
    totalRecords: 0,
    totalBytes: 0,
    skippedRecords: 0,
    skippedBytes: 0,
    pluginsProcessed: 0,
    recordsByType: {},
    skippedTypes: new Set<string>(),
    skippedByType: {},
    skippedSizeByType: {},
    errors: {},
  };

  /**
   * Get formatted stats for reporting
   */
  public getStats(): string {
    const stats = this.stats;
    const totalSize = this.formatBytes(stats.totalBytes);
    const skippedSize = this.formatBytes(stats.skippedBytes);

    let report = `\nProcessing Statistics:\n`;
    report += `----------------------------------------\n`;
    report += `Total Records: ${stats.totalRecords}\n`;
    report += `Total Bytes: ${totalSize}\n`;
    report += `Skipped Records: ${stats.skippedRecords}\n`;
    report += `Skipped Bytes: ${skippedSize}\n`;
    report += `Plugins Processed: ${stats.pluginsProcessed}\n`;
    report += `\nRecords by Type:\n`;
    report += `----------------------------------------\n`;

    // Sort record types by count
    const sortedTypes = Object.entries(stats.recordsByType).sort(
      (a, b) => b[1] - a[1]
    );

    for (const [type, count] of sortedTypes) {
      report += `  ${type}: ${count} records\n`;
    }

    if (stats.skippedRecords > 0) {
      report += `\nSkipped Record Types:\n`;
      report += `----------------------------------------\n`;
      for (const type of stats.skippedTypes) {
        const count = stats.skippedByType[type] || 0;
        const size = this.formatBytes(stats.skippedSizeByType[type] || 0);
        report += `  ${type}: ${count} records (${size})\n`;
      }
    }

    if (Object.keys(stats.errors).length > 0) {
      report += `\nErrors by Type:\n`;
      report += `----------------------------------------\n`;
      for (const [errorType, count] of Object.entries(stats.errors)) {
        report += `  ${errorType}: ${count} errors\n`;
      }
    }

    return report;
  }

  /**
   * Format bytes to human readable format
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return "0 B";

    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  }

  /**
   * Record a processed record
   */
  public recordProcessed(type: string, size: number): void {
    this.stats.totalRecords++;
    this.stats.totalBytes += size;
    this.stats.recordsByType[type] = (this.stats.recordsByType[type] || 0) + 1;
  }

  /**
   * Record a skipped record
   */
  public recordSkipped(type: string, size: number): void {
    this.stats.skippedRecords++;
    this.stats.skippedBytes += size;
    this.stats.skippedTypes.add(type);
    this.stats.skippedByType[type] = (this.stats.skippedByType[type] || 0) + 1;
    this.stats.skippedSizeByType[type] =
      (this.stats.skippedSizeByType[type] || 0) + size;
  }

  /**
   * Record an error
   */
  public recordError(errorType: string): void {
    this.stats.errors[errorType] = (this.stats.errors[errorType] || 0) + 1;
  }

  /**
   * Record a plugin as processed
   */
  public recordPluginProcessed(): void {
    this.stats.pluginsProcessed++;
  }
}
