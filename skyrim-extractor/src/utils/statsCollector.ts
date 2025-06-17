export interface ProcessingStats {
  totalRecords: number;
  processedRecords: number;
  skippedRecords: {
    byType: Record<string, number>;
    total: number;
  };
  errors: {
    byType: Record<string, number>;
    total: number;
    details: Array<{
      type: string;
      message: string;
      plugin: string;
      recordId?: string;
    }>;
  };
  plugins: {
    [pluginName: string]: {
      processed: number;
      skipped: number;
      errors: number;
    };
  };
}

export class StatsCollector {
  private stats: ProcessingStats = {
    totalRecords: 0,
    processedRecords: 0,
    skippedRecords: {
      byType: {},
      total: 0,
    },
    errors: {
      byType: {},
      total: 0,
      details: [],
    },
    plugins: {},
  };

  recordProcessed(pluginName: string, recordType: string): void {
    this.stats.processedRecords++;
    this.stats.totalRecords++;
    this.ensurePluginStats(pluginName);
    this.stats.plugins[pluginName].processed++;
  }

  recordSkipped(pluginName: string, recordType: string, reason: string): void {
    this.stats.skippedRecords.total++;
    this.stats.skippedRecords.byType[recordType] =
      (this.stats.skippedRecords.byType[recordType] || 0) + 1;
    this.stats.totalRecords++;
    this.ensurePluginStats(pluginName);
    this.stats.plugins[pluginName].skipped++;
  }

  recordError(
    pluginName: string,
    recordType: string,
    message: string,
    recordId?: string
  ): void {
    this.stats.errors.total++;
    this.stats.errors.byType[recordType] =
      (this.stats.errors.byType[recordType] || 0) + 1;
    this.stats.errors.details.push({
      type: recordType,
      message,
      plugin: pluginName,
      recordId,
    });
    this.stats.totalRecords++;
    this.ensurePluginStats(pluginName);
    this.stats.plugins[pluginName].errors++;
  }

  private ensurePluginStats(pluginName: string): void {
    if (!this.stats.plugins[pluginName]) {
      this.stats.plugins[pluginName] = {
        processed: 0,
        skipped: 0,
        errors: 0,
      };
    }
  }

  getStats(): ProcessingStats {
    return { ...this.stats };
  }

  reset(): void {
    this.stats = {
      totalRecords: 0,
      processedRecords: 0,
      skippedRecords: {
        byType: {},
        total: 0,
      },
      errors: {
        byType: {},
        total: 0,
        details: [],
      },
      plugins: {},
    };
  }
}
