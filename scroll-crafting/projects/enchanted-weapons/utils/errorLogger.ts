import fs from "fs";
import path from "path";

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
  details?: any;
  weaponName?: string;
  formId?: string;
  plugin?: string;
}

export class ErrorLogger {
  private logDir: string;
  private logFile: string;
  private errors: ErrorLogEntry[] = [];

  constructor(projectName: string = "enchanted-weapons") {
    this.logDir = path.join(process.cwd(), "projects", projectName, "errors");
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
   * Log an error entry
   */
  log(entry: Omit<ErrorLogEntry, "timestamp">): void {
    const fullEntry: ErrorLogEntry = {
      ...entry,
      timestamp: new Date().toISOString(),
    };

    this.errors.push(fullEntry);

    // Also log to console for immediate visibility
    const consoleMessage = `[${fullEntry.level}] [${fullEntry.category}] ${fullEntry.message}`;
    if (fullEntry.weaponName) {
      console.log(`${consoleMessage} (Weapon: ${fullEntry.weaponName})`);
    } else {
      console.log(consoleMessage);
    }
  }

  /**
   * Log a performance warning
   */
  logPerformance(message: string, details?: any): void {
    this.log({
      level: "WARN",
      category: "PERFORMANCE",
      message,
      details,
    });
  }

  /**
   * Log a data quality issue
   */
  logDataQuality(
    message: string,
    weaponName?: string,
    formId?: string,
    plugin?: string,
    details?: any
  ): void {
    this.log({
      level: "WARN",
      category: "DATA_QUALITY",
      message,
      weaponName,
      formId,
      plugin,
      details,
    });
  }

  /**
   * Log a template error
   */
  logTemplate(message: string, details?: any): void {
    this.log({
      level: "ERROR",
      category: "TEMPLATE",
      message,
      details,
    });
  }

  /**
   * Log a pattern recognition failure
   */
  logPatternRecognition(
    weaponName: string,
    reason: string,
    details?: any
  ): void {
    this.log({
      level: "INFO",
      category: "PATTERN_RECOGNITION",
      message: `Failed to parse weapon name: "${weaponName}" - ${reason}`,
      weaponName,
      details,
    });
  }

  /**
   * Log a schema validation error
   */
  logSchema(message: string, formId?: string, details?: any): void {
    this.log({
      level: "ERROR",
      category: "SCHEMA",
      message,
      formId,
      details,
    });
  }

  /**
   * Log a general error
   */
  logError(message: string, details?: any): void {
    this.log({
      level: "ERROR",
      category: "GENERAL",
      message,
      details,
    });
  }

  /**
   * Log missing enchantment reference
   */
  logMissingEnchantment(
    weaponName: string,
    formId: string,
    plugin?: string
  ): void {
    this.logDataQuality(
      `Enchantment not found for weapon`,
      weaponName,
      formId,
      plugin
    );
  }

  /**
   * Log missing magic effect reference
   */
  logMissingMagicEffect(
    enchantmentName: string,
    formId: string,
    plugin?: string
  ): void {
    this.logDataQuality(
      `Magic effect not found for enchantment`,
      enchantmentName,
      formId,
      plugin
    );
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
   * Get errors by category
   */
  getErrorsByCategory(category: ErrorLogEntry["category"]): ErrorLogEntry[] {
    return this.errors.filter((error) => error.category === category);
  }

  /**
   * Get errors by level
   */
  getErrorsByLevel(level: ErrorLogEntry["level"]): ErrorLogEntry[] {
    return this.errors.filter((error) => error.level === level);
  }

  /**
   * Get pattern recognition failures
   */
  getPatternRecognitionFailures(): string[] {
    return this.errors
      .filter((error) => error.category === "PATTERN_RECOGNITION")
      .map((error) => error.weaponName)
      .filter((name): name is string => name !== undefined);
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

    const patternFailures = this.getPatternRecognitionFailures();
    const dataQualityIssues = this.getErrorsByCategory("DATA_QUALITY");
    const templateErrors = this.getErrorsByCategory("TEMPLATE");

    const summary = `# Error Summary Report

Generated: ${new Date().toISOString()}

## Statistics
- **Total Errors**: ${stats.total}
- **By Level**: ${JSON.stringify(stats.byLevel, null, 2)}
- **By Category**: ${JSON.stringify(stats.byCategory, null, 2)}

## Pattern Recognition Failures (${patternFailures.length})
${patternFailures.map((name) => `- ${name}`).join("\n")}

## Data Quality Issues (${dataQualityIssues.length})
${dataQualityIssues.map((error) => `- ${error.message}${error.weaponName ? ` (${error.weaponName})` : ""}`).join("\n")}

## Template Errors (${templateErrors.length})
${templateErrors.map((error) => `- ${error.message}`).join("\n")}

## Recommendations
${this.generateRecommendations()}
`;

    fs.writeFileSync(summaryFile, summary);
  }

  /**
   * Generate recommendations based on errors
   */
  private generateRecommendations(): string {
    const stats = this.getStats();
    const recommendations: string[] = [];

    if (stats.byCategory["PATTERN_RECOGNITION"] > 0) {
      recommendations.push(
        "- Improve pattern recognition to handle complex weapon names"
      );
    }

    if (stats.byCategory["DATA_QUALITY"] > 0) {
      recommendations.push(
        "- Add data validation for missing enchantment and magic effect references"
      );
    }

    if (stats.byCategory["TEMPLATE"] > 0) {
      recommendations.push("- Review and fix template syntax errors");
    }

    if (stats.byCategory["PERFORMANCE"] > 0) {
      recommendations.push(
        "- Monitor performance bottlenecks and optimize accordingly"
      );
    }

    return recommendations.join("\n");
  }

  /**
   * Clear all errors (useful for testing)
   */
  clear(): void {
    this.errors = [];
  }
}

// Export a singleton instance
export const errorLogger = new ErrorLogger();
