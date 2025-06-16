import {
  parseRecordHeader as parseRecordHeaderFromBuffer,
  scanSubrecords,
} from "./binary-decoders/recordParser";
import { ParsedRecord, RecordHeader } from "./types";
import { RECORD_HEADER } from "./utils/buffer.constants";
import { PROCESSED_RECORD_TYPES, ProcessedRecordType } from "./constants";
import { StatsCollector } from "./utils/stats";
import { processGRUP } from "./binary-decoders/grup/grupHandler";
import { processRecord } from "./utils/recordProcessor";
import { debugLog } from "./utils/debugUtils";

// Create a singleton stats collector
const statsCollector = new StatsCollector();

/**
 * High-level plugin processing functions
 */

/**
 * Parse a record header from a buffer
 */
function parseRecordHeader(buffer: Buffer): RecordHeader {
  return parseRecordHeaderFromBuffer(buffer);
}

/**
 * Check if a record type should be processed
 */
function shouldProcessRecordType(type: string): boolean {
  const shouldProcess = PROCESSED_RECORD_TYPES.has(type as ProcessedRecordType);
  if (!shouldProcess) {
    statsCollector.recordSkipped(type, 0); // We don't have size info at this point, will be updated in recordProcessor
    debugLog(`[pluginProcessor] Skipping unsupported record type: ${type}`);
  }
  return shouldProcess;
}

/**
 * Validate record size
 */
function validateRecordSize(
  header: RecordHeader,
  buffer: Buffer,
  offset: number
): void {
  if (header.dataSize < 0) {
    throw new Error(`Invalid record data size: ${header.dataSize}`);
  }
  if (offset + RECORD_HEADER.TOTAL_SIZE + header.dataSize > buffer.length) {
    throw new Error(
      `Record size exceeds buffer length: ${
        offset + RECORD_HEADER.TOTAL_SIZE + header.dataSize
      } > ${buffer.length}`
    );
  }
}

/**
 * Group records by their type
 */
function groupRecordsByType(
  records: ParsedRecord[]
): Record<string, ParsedRecord[]> {
  return records.reduce((acc, record) => {
    const type = record.meta.type;
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(record);
    return acc;
  }, {} as Record<string, ParsedRecord[]>);
}

/**
 * Process an entire plugin file and return records grouped by type
 */ function processPlugin(
  pluginBuffer: Buffer,
  pluginName: string
): Record<string, ParsedRecord[]> {
  try {
    const records: ParsedRecord[] = [];
    let offset = 0;
    let grupCount = 0;
    let normalRecordCount = 0;
    let endOfBufferCount = 0;
    let lastOffset = -1;
    let stuckCount = 0;

    debugLog(`\n[pluginProcessor] Starting to process plugin: ${pluginName}`);
    debugLog(`  Buffer length: ${pluginBuffer.length} bytes`);

    while (offset < pluginBuffer.length) {
      // Check if we're stuck at the same offset
      if (offset === lastOffset) {
        stuckCount++;
        debugLog(
          `[pluginProcessor] WARNING: Stuck at offset ${offset} (count: ${stuckCount})`
        );
        if (stuckCount > 3) {
          debugLog(
            `[pluginProcessor] ERROR: Stuck at offset ${offset} too many times, breaking loop`
          );
          break;
        }
        // Force advance by at least one byte to prevent infinite loop
        offset++;
        continue;
      }
      lastOffset = offset;
      stuckCount = 0;

      // Check if we have enough bytes for a record header
      if (offset + RECORD_HEADER.TOTAL_SIZE > pluginBuffer.length) {
        debugLog(
          `[pluginProcessor] Not enough bytes remaining for a record header at offset ${offset}`
        );
        break;
      }

      const recordType = pluginBuffer.toString("ascii", offset, offset + 4);
      debugLog(
        `[pluginProcessor] Processing at offset ${offset}/${
          pluginBuffer.length
        } (${Math.round(
          (offset / pluginBuffer.length) * 100
        )}%): type=${recordType}`
      );

      if (recordType === "GRUP") {
        grupCount++;
        // Process GRUP and get all records from it
        const grupRecords = processGRUP(pluginBuffer, offset, pluginName);
        debugLog(
          `[pluginProcessor] GRUP at offset ${offset} returned ${grupRecords.length} records`
        );
        records.push(...grupRecords);

        // Get the GRUP size from its header
        const grupHeader = parseRecordHeader(
          pluginBuffer.slice(offset, offset + RECORD_HEADER.TOTAL_SIZE)
        );
        const oldOffset = offset;
        offset += RECORD_HEADER.TOTAL_SIZE + grupHeader.dataSize;
        debugLog(
          `[pluginProcessor] GRUP size: ${grupHeader.dataSize}, advancing offset: ${oldOffset} -> ${offset}`
        );
      } else {
        normalRecordCount++;
        // Process normal record
        const { record, newOffset } = processRecord(
          pluginBuffer,
          offset,
          pluginName
        );

        // If we hit the end of buffer, break out of the loop
        if (newOffset === pluginBuffer.length) {
          endOfBufferCount++;
          debugLog(
            `[pluginProcessor] Reached end of buffer at offset ${offset} (count: ${endOfBufferCount})`
          );
          if (endOfBufferCount > 1) {
            debugLog(
              `[pluginProcessor] Reached end of buffer multiple times, stopping processing`
            );
            break;
          }
        }

        if (record) {
          records.push(record);
          // Record stats for this record
          const recordSize = newOffset - offset;
          statsCollector.recordProcessed(record.meta.type, recordSize);
          debugLog(
            `[pluginProcessor] Added record of type ${record.meta.type} (size: ${recordSize} bytes)`
          );
        } else {
          debugLog(
            `[pluginProcessor] Record at offset ${offset} was not processed (newOffset: ${newOffset})`
          );
        }
        offset = newOffset;
      }
    }

    debugLog(`\n[pluginProcessor] Finished processing plugin: ${pluginName}`);
    debugLog(`  Total GRUPs found: ${grupCount}`);
    debugLog(`  Total normal records found: ${normalRecordCount}`);
    debugLog(`  Total records after processing: ${records.length}`);
    debugLog(`  End of buffer reached ${endOfBufferCount} times`);
    debugLog(
      `  Final offset: ${offset}/${pluginBuffer.length} (${Math.round(
        (offset / pluginBuffer.length) * 100
      )}%)`
    );

    statsCollector.recordPluginProcessed();
    const groupedRecords = groupRecordsByType(records);

    // Log record counts by type
    debugLog("\n[pluginProcessor] Records by type:");
    Object.entries(groupedRecords).forEach(([type, typeRecords]) => {
      debugLog(`  ${type}: ${typeRecords.length} records`);
    });

    return groupedRecords;
  } catch (error) {
    statsCollector.recordError(error instanceof Error ? error.name : "Unknown");
    throw error;
  }
}

// Export the stats collector instance
//  { statsCollector as stats };
