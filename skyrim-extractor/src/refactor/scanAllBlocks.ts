import { BufferMeta } from "./types";
import { formatFormId } from "@lorerim/platform-types";
import { StatsCollector } from "../utils/statsCollector";
import { parseRecordFlags } from "@lorerim/platform-types/src/binary/header-flags";

interface ScanContext {
  sourcePlugin: string;
  modFolder: string;
  pluginIndex: number;
  recordTypeFilter?: string[];
  onLog?: (level: "info" | "debug", message: string) => void;
  statsCollector?: StatsCollector;
  tagCounts?: Map<string, TagStats>;
}

interface TagStats {
  count: number;
  compressed: number;
}

enum GrupOffset {
  Label = 8,
  GroupType = 12,
  DataSize = 16,
  TotalSize = 20,
  EndOffset = 24,
  FormId = 8,
  DataOffset = 24,
}

enum RecordOffset {
  Size = 4,
  FormId = 12,
  DataOffset = 24,
}

interface ScanReport {
  tagCounts: Map<string, TagStats>;
  totalRecords: number;
  sourcePlugin: string;
}

interface ScanResult {
  results: BufferMeta[];
  report: ScanReport;
}

export async function scanAllBlocks(
  buffer: Buffer,
  context: ScanContext,
  parentPath: string[] = [],
  startOffset: number = 0,
  maxOffset: number = buffer.length
): Promise<ScanResult> {
  const results: BufferMeta[] = [];
  let offset = startOffset;
  
  // Create a new Map for this level's counts
  const localTagCounts = new Map<string, TagStats>();

  while (offset < maxOffset) {
    const tag = buffer.toString("ascii", offset, offset + 4);
    const size = buffer.readUInt32LE(offset + 4);
    const endOffset = offset + size;

    // Initialize or get tag stats
    const currentStats = localTagCounts.get(tag) || { count: 0, compressed: 0 };
    currentStats.count++;
    localTagCounts.set(tag, currentStats);

    if (tag === "GRUP") {
      const label = buffer.readUInt32LE(offset + GrupOffset.Label);
      const groupType = buffer.readUInt32LE(offset + GrupOffset.GroupType);

      // Create a new parent path array with a maximum depth
      const MAX_PATH_DEPTH = 10; // Prevent excessive nesting
      const newParentPath =
        parentPath.length >= MAX_PATH_DEPTH
          ? [
              ...parentPath.slice(-MAX_PATH_DEPTH + 1),
              `GRUP:${groupType}:${label.toString(16).toUpperCase()}`,
            ]
          : [
              ...parentPath,
              `GRUP:${groupType}:${label.toString(16).toUpperCase()}`,
            ];

      // Create GRUP metadata
      const grupMeta = {
        tag: "GRUP",
        offset,
        endOffset,
        size,
        groupType,
        label,
        parentPath: newParentPath,
        sourcePlugin: context.sourcePlugin,
        modFolder: context.modFolder,
        pluginIndex: context.pluginIndex,
      };

      results.push(grupMeta);

      // Recursively scan the GRUP contents
      const { results: groupResults, report: groupReport } = await scanAllBlocks(
        buffer,
        context,
        newParentPath,
        offset + GrupOffset.EndOffset,
        endOffset
      );
      
      // Merge the group's tag counts into our local counts
      groupReport.tagCounts.forEach((stats, tag) => {
        const currentStats = localTagCounts.get(tag) || { count: 0, compressed: 0 };
        currentStats.count += stats.count;
        currentStats.compressed += stats.compressed;
        localTagCounts.set(tag, currentStats);
      });
      
      results.push(...groupResults);
      offset = endOffset;
    } else if (tag === "TES4") {
      const dataSize = buffer.readUInt32LE(offset + RecordOffset.Size);
      const totalSize = RecordOffset.DataOffset + dataSize;

      offset += totalSize;
      continue;
    } else {
      const dataSize = size;
      const totalSize = RecordOffset.DataOffset + dataSize;
      // Skip if record type is filtered
      if (context.recordTypeFilter && !context.recordTypeFilter.includes(tag)) {
        context.statsCollector?.recordSkipped(
          context.sourcePlugin,
          tag,
          "Filtered by record type"
        );
        offset += totalSize;
        continue;
      }

      try {
        const formId = buffer.readUInt32LE(offset + RecordOffset.FormId);
        const flags = parseRecordFlags(buffer.subarray(offset));
        
        // Update compressed count if record is compressed
        if (flags.isCompressed || flags.isObsoleteCompressed) {
          const currentStats = localTagCounts.get(tag)!;
          currentStats.compressed++;
          localTagCounts.set(tag, currentStats);
        }

        context.statsCollector?.recordProcessed(context.sourcePlugin, tag);

        const recordMeta = {
          tag,
          offset,
          endOffset: offset + totalSize,
          size: totalSize,
          formId,
          parentPath: [...parentPath],
          sourcePlugin: context.sourcePlugin,
          modFolder: context.modFolder,
          pluginIndex: context.pluginIndex,
        };

        results.push(recordMeta);
      } catch (error) {
        context.statsCollector?.recordError(
          context.sourcePlugin,
          tag,
          error instanceof Error ? error.message : String(error),
          formatFormId(buffer.readUInt32LE(offset + RecordOffset.FormId))
        );
      }
      offset += totalSize;
    }
  }

  // Format the final counts report - only log at root level
  if (parentPath.length === 0) {
    const formattedCounts = Object.fromEntries(
      Array.from(localTagCounts.entries()).map(([tag, stats]) => [
        tag,
        `count: ${stats.count}, compressed: ${stats.compressed}`
      ])
    );
    context.onLog?.("debug", `Final counts for ${context.sourcePlugin}: ${JSON.stringify(formattedCounts, null, 2)}`);
  }

  return {
    results,
    report: {
      tagCounts: localTagCounts,
      totalRecords: results.length,
      sourcePlugin: context.sourcePlugin
    }
  };
}
