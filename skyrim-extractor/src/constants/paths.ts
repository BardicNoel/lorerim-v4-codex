import { join } from "path";

export const PATHS = {
  OUTPUT: {
    ROOT: "output",
    RECORDS: "records",
    STATS: "stats",
    DEBUG: "debug",
  },
  LOGS: {
    DEBUG: "debug.log",
    THREAD: "thread-debug.txt",
    BUFFER: "buffer-debug-output.json",
  },
} as const;

/**
 * Build a path relative to the current working directory
 */
export function buildPath(...parts: string[]): string {
  return join(process.cwd(), ...parts);
}

/**
 * Build an output path for a specific record type
 */
export function buildRecordPath(outputDir: string, recordType: string): string {
  return join(outputDir, PATHS.OUTPUT.RECORDS, `${recordType}.json`);
}

/**
 * Build a debug log path
 */
export function buildDebugLogPath(outputDir: string): string {
  return join(outputDir, PATHS.OUTPUT.DEBUG, PATHS.LOGS.DEBUG);
}

/**
 * Build a thread debug log path
 */
export function buildThreadLogPath(outputDir: string): string {
  return join(outputDir, PATHS.OUTPUT.DEBUG, PATHS.LOGS.THREAD);
}

/**
 * Build a buffer debug output path
 */
export function buildBufferLogPath(outputDir: string): string {
  return join(outputDir, PATHS.OUTPUT.DEBUG, PATHS.LOGS.BUFFER);
}
