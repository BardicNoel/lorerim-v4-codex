import { BufferMeta } from "../refactor/types";
import { ParsedRecord } from "@lorerim/platform-types";

interface RecordCounts {
  [key: string]: number;
}

interface PluginRecordStats {
  [pluginName: string]: RecordCounts;
}

/**
 * Processes an array of BufferMeta objects to count record types per plugin
 * @param bufferMetas Array of BufferMeta objects from plugin scanning
 * @returns Object mapping plugin names to their record type counts
 */
export function countRecordsByPlugin(
  bufferMetas: BufferMeta[]
): PluginRecordStats {
  const stats: PluginRecordStats = {};

  for (const meta of bufferMetas) {
    // Skip GRUP records and TES4 header
    if (meta.tag === "GRUP" || meta.tag === "TES4") continue;

    const pluginName = meta.sourcePlugin;

    // Initialize plugin stats if not exists
    if (!stats[pluginName]) {
      stats[pluginName] = {};
    }

    // Increment count for this record type
    const recordType = meta.tag;
    stats[pluginName][recordType] = (stats[pluginName][recordType] || 0) + 1;
  }

  return stats;
}

/**
 * Processes an array of ParsedRecord objects to count record types per plugin
 * @param records Array of ParsedRecord objects from plugin scanning
 * @returns Object mapping plugin names to their record type counts
 */
export function countParsedRecordsByPlugin(
  records: ParsedRecord[]
): PluginRecordStats {
  const stats: PluginRecordStats = {};

  for (const record of records) {
    const pluginName = record.meta.plugin;
    const recordType = record.meta.type;

    // Initialize plugin stats if not exists
    if (!stats[pluginName]) {
      stats[pluginName] = {};
    }

    // Increment count for this record type
    stats[pluginName][recordType] = (stats[pluginName][recordType] || 0) + 1;
  }

  return stats;
}
