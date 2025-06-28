import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { ErrorLogger, ErrorLogEntry } from "../utils/errorLogger.js";
import fs from "fs";
import path from "path";

describe("ErrorLogger", () => {
  let errorLogger: ErrorLogger;
  let testLogDir: string;

  beforeEach(() => {
    // Create a test-specific logger
    testLogDir = path.join(
      process.cwd(),
      "projects",
      "enchanted-weapons",
      "errors",
      "test"
    );
    errorLogger = new ErrorLogger("enchanted-weapons");

    // Clear any existing errors
    errorLogger.clear();
  });

  afterEach(() => {
    // Clean up test files
    if (fs.existsSync(testLogDir)) {
      fs.rmSync(testLogDir, { recursive: true, force: true });
    }
  });

  describe("basic logging", () => {
    it("should log errors with timestamps", () => {
      const beforeLog = new Date();
      errorLogger.logError("Test error message");
      const afterLog = new Date();

      const stats = errorLogger.getStats();
      expect(stats.total).toBe(1);
      expect(stats.byLevel["ERROR"]).toBe(1);
      expect(stats.byCategory["GENERAL"]).toBe(1);
    });

    it("should log data quality issues", () => {
      errorLogger.logDataQuality(
        "Missing enchantment",
        "TestWeapon",
        "12345678",
        "test.esp"
      );

      const stats = errorLogger.getStats();
      expect(stats.total).toBe(1);
      expect(stats.byLevel["WARN"]).toBe(1);
      expect(stats.byCategory["DATA_QUALITY"]).toBe(1);
    });

    it("should log pattern recognition failures", () => {
      errorLogger.logPatternRecognition(
        "ComplexWeaponName",
        "No pattern matched"
      );

      const stats = errorLogger.getStats();
      expect(stats.total).toBe(1);
      expect(stats.byLevel["INFO"]).toBe(1);
      expect(stats.byCategory["PATTERN_RECOGNITION"]).toBe(1);
    });
  });

  describe("specialized logging methods", () => {
    it("should log missing enchantments", () => {
      errorLogger.logMissingEnchantment("TestWeapon", "12345678", "test.esp");

      const errors = errorLogger.getErrorsByCategory("DATA_QUALITY");
      expect(errors).toHaveLength(1);
      expect(errors[0].weaponName).toBe("TestWeapon");
      expect(errors[0].formId).toBe("12345678");
      expect(errors[0].plugin).toBe("test.esp");
    });

    it("should log missing magic effects", () => {
      errorLogger.logMissingMagicEffect(
        "TestEnchantment",
        "87654321",
        "test.esp"
      );

      const errors = errorLogger.getErrorsByCategory("DATA_QUALITY");
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toContain("Magic effect not found");
    });
  });

  describe("statistics", () => {
    it("should provide accurate statistics", () => {
      errorLogger.logError("Error 1");
      errorLogger.logError("Error 2");
      errorLogger.logDataQuality("Warning 1");
      errorLogger.logPatternRecognition("Weapon1", "Reason 1");
      errorLogger.logPatternRecognition("Weapon2", "Reason 2");

      const stats = errorLogger.getStats();
      expect(stats.total).toBe(5);
      expect(stats.byLevel["ERROR"]).toBe(2);
      expect(stats.byLevel["WARN"]).toBe(1);
      expect(stats.byLevel["INFO"]).toBe(2);
      expect(stats.byCategory["GENERAL"]).toBe(2);
      expect(stats.byCategory["DATA_QUALITY"]).toBe(1);
      expect(stats.byCategory["PATTERN_RECOGNITION"]).toBe(2);
    });
  });

  describe("filtering", () => {
    it("should filter errors by category", () => {
      errorLogger.logError("General error");
      errorLogger.logDataQuality("Data quality issue");
      errorLogger.logPatternRecognition("Weapon", "Reason");

      const dataQualityErrors = errorLogger.getErrorsByCategory("DATA_QUALITY");
      expect(dataQualityErrors).toHaveLength(1);
      expect(dataQualityErrors[0].message).toBe("Data quality issue");
    });

    it("should filter errors by level", () => {
      errorLogger.logError("Error message");
      errorLogger.logDataQuality("Warning message");
      errorLogger.logPatternRecognition("Weapon", "Reason");

      const errorLevelErrors = errorLogger.getErrorsByLevel("ERROR");
      expect(errorLevelErrors).toHaveLength(1);
      expect(errorLevelErrors[0].message).toBe("Error message");
    });

    it("should get pattern recognition failures", () => {
      errorLogger.logPatternRecognition("Weapon1", "Reason 1");
      errorLogger.logPatternRecognition("Weapon2", "Reason 2");
      errorLogger.logError("General error");

      const failures = errorLogger.getPatternRecognitionFailures();
      expect(failures).toHaveLength(2);
      expect(failures).toContain("Weapon1");
      expect(failures).toContain("Weapon2");
    });
  });

  describe("file operations", () => {
    it("should write errors to file", () => {
      errorLogger.logError("Test error");
      errorLogger.logDataQuality("Test warning");

      // Mock the writeToFile method to avoid actual file writing in tests
      const writeSpy = vi
        .spyOn(fs, "writeFileSync")
        .mockImplementation(() => {});

      errorLogger.writeToFile();

      expect(writeSpy).toHaveBeenCalled();
      writeSpy.mockRestore();
    });

    it("should write summary report", () => {
      errorLogger.logError("Test error");
      errorLogger.logPatternRecognition("TestWeapon", "Test reason");

      // Mock the writeFileSync method
      const writeSpy = vi
        .spyOn(fs, "writeFileSync")
        .mockImplementation(() => {});

      errorLogger.writeSummaryReport();

      expect(writeSpy).toHaveBeenCalled();
      writeSpy.mockRestore();
    });
  });

  describe("clear functionality", () => {
    it("should clear all errors", () => {
      errorLogger.logError("Test error");
      errorLogger.logDataQuality("Test warning");

      expect(errorLogger.getStats().total).toBe(2);

      errorLogger.clear();

      expect(errorLogger.getStats().total).toBe(0);
    });
  });
});
