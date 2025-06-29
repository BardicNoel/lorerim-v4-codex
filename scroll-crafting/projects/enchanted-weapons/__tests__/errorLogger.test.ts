import { describe, it, expect, beforeEach } from "vitest";
import { ErrorLogger } from "../utils/error-logger.js";

describe("ErrorLogger", () => {
  let errorLogger: ErrorLogger;

  beforeEach(() => {
    errorLogger = new ErrorLogger("test");
  });

  it("should log data quality issues", () => {
    errorLogger.logDataQuality(
      "Test data quality issue",
      "TestRecord",
      "0x123",
      "test.esp"
    );

    const stats = errorLogger.getStats();
    expect(stats.total).toBe(1);
    expect(stats.byLevel.WARN).toBe(1);
    expect(stats.byCategory.DATA_QUALITY).toBe(1);
  });

  it("should log missing magic effects", () => {
    errorLogger.logMissingMagicEffect("TestEnchantment", "0x123", "test.esp");

    const stats = errorLogger.getStats();
    expect(stats.total).toBe(1);
    expect(stats.byLevel.WARN).toBe(1);
    expect(stats.byCategory.DATA_QUALITY).toBe(1);
  });

  it("should log missing enchantments", () => {
    errorLogger.logMissingEnchantment("TestWeapon", "0x123", "test.esp");

    const stats = errorLogger.getStats();
    expect(stats.total).toBe(1);
    expect(stats.byLevel.WARN).toBe(1);
    expect(stats.byCategory.DATA_QUALITY).toBe(1);
  });

  it("should log pattern recognition failures", () => {
    errorLogger.logPatternRecognition("TestWeapon", "No matching pattern");

    const stats = errorLogger.getStats();
    expect(stats.total).toBe(1);
    expect(stats.byLevel.INFO).toBe(1);
    expect(stats.byCategory.PATTERN_RECOGNITION).toBe(1);
  });

  it("should log general errors", () => {
    errorLogger.logError("Test error", { detail: "test" });

    const stats = errorLogger.getStats();
    expect(stats.total).toBe(1);
    expect(stats.byLevel.ERROR).toBe(1);
    expect(stats.byCategory.GENERAL).toBe(1);
  });

  it("should calculate error statistics correctly", () => {
    errorLogger.logError("Error 1");
    errorLogger.logDataQuality("Warning 1");
    errorLogger.logPatternRecognition("Record 1", "No pattern");

    const stats = errorLogger.getStats();
    expect(stats.total).toBe(3);
    expect(stats.byLevel.ERROR).toBe(1);
    expect(stats.byLevel.WARN).toBe(1);
    expect(stats.byLevel.INFO).toBe(1);
    expect(stats.byCategory.GENERAL).toBe(1);
    expect(stats.byCategory.DATA_QUALITY).toBe(1);
    expect(stats.byCategory.PATTERN_RECOGNITION).toBe(1);
  });

  it("should clear errors", () => {
    errorLogger.logError("Error 1");
    errorLogger.logDataQuality("Warning 1");

    expect(errorLogger.getStats().total).toBe(2);

    errorLogger.clearErrors();

    expect(errorLogger.getStats().total).toBe(0);
  });

  it("should generate error summary", () => {
    errorLogger.logError("Test error");
    errorLogger.logDataQuality("Test warning");

    const summary = errorLogger.getErrorSummary();
    expect(summary).toContain("Error Summary:");
    expect(summary).toContain("Test error");
    expect(summary).toContain("Test warning");
  });
});
