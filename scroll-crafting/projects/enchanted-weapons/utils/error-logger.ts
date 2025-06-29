import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

export interface ErrorLogEntry {
  timestamp: string;
  level: "ERROR" | "WARN" | "INFO" | "DEBUG";
  category:
    | "PERFORMANCE"
    | "DATA_QUALITY"
    | "TEMPLATE"
    | "PATTERN_RECOGNITION"
    | "SCHEMA"
    | "GENERAL";
  message: string;
  recordName?: string;
  formId?: string;
  plugin?: string;
  context?: Record<string, any>;
}

export class ErrorLogger {
  private errors: ErrorLogEntry[] = [];
  private detailedErrors: ErrorLogEntry[] = [];
  private logDir: string;
  private logFile: string;

  constructor(projectName: string = "enchanted-weapons") {
    // Convert ESM __dirname
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    // Since we're in utils/, we need to go up one directory to get to the project root
    const projectRoot = path.resolve(__dirname, "..");

    this.logDir = path.join(projectRoot, "errors");
    this.logFile = path.join(
      this.logDir,
      `error-log-${new Date().toISOString().split("T")[0]}.json`
    );

    // Ensure errors directory exists
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  /**
   * Internal log method
   */
  private log(entry: Omit<ErrorLogEntry, "timestamp">): void {
    const fullEntry: ErrorLogEntry = {
      ...entry,
      timestamp: new Date().toISOString(),
    };

    // Log to console for immediate feedback
    let consoleMessage = `[${fullEntry.level}] ${fullEntry.message}`;
    if (fullEntry.recordName) {
      consoleMessage += ` (Record: ${fullEntry.recordName})`;
    }
    if (fullEntry.formId) {
      consoleMessage += ` (FormID: ${fullEntry.formId})`;
    }
    if (fullEntry.plugin) {
      consoleMessage += ` (Plugin: ${fullEntry.plugin})`;
    }
    console.log(consoleMessage);

    this.errors.push(fullEntry);
    this.detailedErrors.push(fullEntry);
  }

  /**
   * Log a data quality issue
   */
  logDataQuality(
    message: string,
    recordName?: string,
    formId?: string,
    plugin?: string,
    context?: Record<string, any>
  ): void {
    this.log({
      level: "WARN",
      category: "DATA_QUALITY",
      message,
      recordName,
      formId,
      plugin,
      context,
    });
  }

  /**
   * Log missing magic effect reference
   */
  logMissingMagicEffect(
    enchantmentName: string,
    formId: string,
    plugin?: string,
    context?: Record<string, any>
  ): void {
    this.logDataQuality(
      `Magic effect not found for enchantment`,
      enchantmentName,
      formId,
      plugin,
      context
    );
  }

  /**
   * Log missing enchantment reference
   */
  logMissingEnchantment(
    weaponName: string,
    formId: string,
    plugin?: string,
    context?: Record<string, any>
  ): void {
    this.logDataQuality(
      `Enchantment not found for weapon`,
      weaponName,
      formId,
      plugin,
      context
    );
  }

  /**
   * Log pattern recognition failure
   */
  logPatternRecognition(
    recordName: string,
    reason: string,
    context?: Record<string, any>
  ): void {
    this.log({
      level: "INFO",
      category: "PATTERN_RECOGNITION",
      message: `Failed to recognize pattern: ${reason}`,
      recordName,
      context,
    });
  }

  /**
   * Log a general error
   */
  logError(message: string, context?: Record<string, any>): void {
    this.log({
      level: "ERROR",
      category: "GENERAL",
      message,
      context,
    });
  }

  /**
   * Get error statistics
   */
  getStats(): {
    total: number;
    byLevel: Record<string, number>;
    byCategory: Record<string, number>;
  } {
    const byLevel: Record<string, number> = {};
    const byCategory: Record<string, number> = {};

    this.errors.forEach((error) => {
      byLevel[error.level] = (byLevel[error.level] || 0) + 1;
      byCategory[error.category] = (byCategory[error.category] || 0) + 1;
    });

    return {
      total: this.errors.length,
      byLevel,
      byCategory,
    };
  }

  /**
   * Write errors to file
   */
  writeToFile(): void {
    const logData = {
      timestamp: new Date().toISOString(),
      stats: this.getStats(),
      errors: this.errors,
    };

    fs.writeFileSync(this.logFile, JSON.stringify(logData, null, 2));
  }

  /**
   * Write a summary report
   */
  writeSummaryReport(): void {
    const stats = this.getStats();
    const summaryFile = path.join(
      this.logDir,
      `summary-${new Date().toISOString().split("T")[0]}.md`
    );

    const summary = `# Error Summary Report

Generated: ${new Date().toISOString()}

## Statistics
- **Total Errors**: ${stats.total}
- **By Level**: ${JSON.stringify(stats.byLevel, null, 2)}
- **By Category**: ${JSON.stringify(stats.byCategory, null, 2)}

## Detailed Errors

${this.errors
  .map(
    (error) => `### ${error.level} - ${error.category}
- **Message**: ${error.message}
- **Record**: ${error.recordName || "N/A"}
- **FormID**: ${error.formId || "N/A"}
- **Plugin**: ${error.plugin || "N/A"}
- **Context**: ${JSON.stringify(error.context || {}, null, 2)}
`
  )
  .join("\n")}
`;

    fs.writeFileSync(summaryFile, summary);
  }

  /**
   * Get error summary
   */
  getErrorSummary(): string {
    let summary = "Error Summary:\n\n";

    // Group errors by message
    const errorCounts = new Map<string, number>();
    for (const error of this.errors) {
      const count = errorCounts.get(error.message) || 0;
      errorCounts.set(error.message, count + 1);
    }

    // Add error counts
    for (const [message, count] of errorCounts.entries()) {
      summary += `${message}: ${count} occurrences\n`;
    }

    // Add detailed errors
    summary += "\nDetailed Errors:\n\n";
    for (const error of this.detailedErrors) {
      summary += JSON.stringify(error, null, 2) + "\n\n";
    }

    return summary;
  }

  /**
   * Clear all errors
   */
  clearErrors(): void {
    this.errors = [];
    this.detailedErrors = [];
  }
}
