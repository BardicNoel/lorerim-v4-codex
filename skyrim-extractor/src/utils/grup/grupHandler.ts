import { ParsedRecord } from "../../types";
import { parseRecordHeader, scanSubrecords } from "../recordParser";
import { setDebugCallback } from "../bufferParser";
import {
  debugLog,
  dumpHex,
  getGroupTypeName,
  errorLog,
  parseGRUPHeader,
  validateGRUPSize,
} from "./grupUtils";
import { RECORD_HEADER } from "../buffer.constants";
import { processRecord } from "../recordProcessor";
import {
  PROCESSED_RECORD_TYPES,
  ProcessedRecordType,
} from "../../constants/recordTypes";

// Set up debug callback
setDebugCallback((message: string) => {
  debugLog(message);
});

/**
 * Main GRUP processing function that handles all GRUP types.
 *
 * GRUP Types:
 * 0 - Top-Level: Contains records of a single type (e.g., all RACE records)
 * 1 - World Children: Contains worldspace records
 * 2 - Interior Cell Block: Contains interior cell records
 * 3 - Interior Cell Sub-Block: Subdivision of interior cells
 * 4 - Exterior Cell Block: Contains exterior cell records
 * 5 - Exterior Cell Sub-Block: Subdivision of exterior cells
 * 6 - Cell Children: Contains cell-specific records
 * 7 - Topic Children: Contains dialogue topic records
 * 8 - Cell Persistent Children: Contains persistent cell records
 * 9 - Cell Temporary Children: Contains temporary cell records
 *
 * @param buffer The plugin file buffer
 * @param offset The offset in the buffer where the GRUP starts
 * @param pluginName The name of the plugin being processed
 * @returns Array of parsed records found in this GRUP
 */
export function processGRUP(
  buffer: Buffer,
  offset: number,
  pluginName: string
): ParsedRecord[] {
  const records: ParsedRecord[] = [];
  const grupHeader = parseRecordHeader(
    buffer.slice(offset, offset + RECORD_HEADER.TOTAL_SIZE)
  );
  const grupSize = grupHeader.dataSize;
  const grupType = buffer.toString("ascii", offset + 8, offset + 12);
  const grupLabel = buffer.readUInt32LE(offset + 12);
  const grupTimestamp = buffer.readUInt32LE(offset + 16);

  debugLog(`\n[grupHandler] Processing GRUP at offset ${offset}`);
  debugLog(`  Type: ${grupType}`);
  debugLog(`  Label: ${grupLabel}`);
  debugLog(`  Size: ${grupSize}`);
  debugLog(`  Timestamp: ${grupTimestamp}`);

  let currentOffset = offset + RECORD_HEADER.TOTAL_SIZE;
  const endOffset = offset + RECORD_HEADER.TOTAL_SIZE + grupSize;
  let recordCount = 0;

  while (currentOffset < endOffset) {
    // Check if we have enough bytes for a record header
    if (currentOffset + RECORD_HEADER.TOTAL_SIZE > endOffset) {
      debugLog(
        `[grupHandler] Not enough bytes remaining for a record header at offset ${currentOffset} (endOffset: ${endOffset})`
      );
      break;
    }

    const recordType = buffer.toString(
      "ascii",
      currentOffset,
      currentOffset + 4
    );
    debugLog(
      `[grupHandler] Processing at offset ${currentOffset}/${endOffset} (${Math.round(
        (currentOffset / endOffset) * 100
      )}%): type=${recordType}`
    );

    if (recordType === "GRUP") {
      // Process nested GRUP
      const nestedRecords = processNestedGRUP(
        buffer,
        currentOffset,
        pluginName
      );
      debugLog(
        `[grupHandler] Nested GRUP returned ${nestedRecords.length} records`
      );
      records.push(...nestedRecords);
      recordCount += nestedRecords.length;

      // Get the nested GRUP size
      const nestedGrupHeader = parseRecordHeader(
        buffer.slice(currentOffset, currentOffset + RECORD_HEADER.TOTAL_SIZE)
      );
      const oldOffset = currentOffset;
      currentOffset += RECORD_HEADER.TOTAL_SIZE + nestedGrupHeader.dataSize;
      debugLog(
        `[grupHandler] GRUP size: ${nestedGrupHeader.dataSize}, advancing offset: ${oldOffset} -> ${currentOffset}`
      );
    } else {
      // Process normal record
      const { record, newOffset } = processRecord(
        buffer,
        currentOffset,
        pluginName
      );
      if (record) {
        records.push(record);
        recordCount++;
        const recordSize = newOffset - currentOffset;
        debugLog(
          `[grupHandler] Added record of type ${record.meta.type} (size: ${recordSize} bytes)`
        );
      } else {
        debugLog(
          `[grupHandler] Record at offset ${currentOffset} was not processed (newOffset: ${newOffset})`
        );
        // If we hit the end of buffer, break out
        if (newOffset === buffer.length) {
          debugLog(
            `[grupHandler] Reached end of buffer, stopping GRUP processing`
          );
          break;
        }
      }
      currentOffset = newOffset;
    }
  }

  debugLog(`[grupHandler] Finished processing GRUP at offset ${offset}`);
  debugLog(`  Total records found: ${recordCount}`);
  debugLog(`  Records by type:`);
  const recordsByType = records.reduce((acc, record) => {
    acc[record.meta.type] = (acc[record.meta.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  Object.entries(recordsByType).forEach(([type, count]) => {
    debugLog(`    ${type}: ${count} records`);
  });

  return records;
}

/**
 * Process a nested GRUP record
 */
function processNestedGRUP(
  buffer: Buffer,
  offset: number,
  pluginName: string
): ParsedRecord[] {
  const records: ParsedRecord[] = [];
  const grupHeader = parseRecordHeader(
    buffer.slice(offset, offset + RECORD_HEADER.TOTAL_SIZE)
  );
  const grupSize = grupHeader.dataSize;
  const grupType = buffer.toString("ascii", offset + 8, offset + 12);
  const grupLabel = buffer.readUInt32LE(offset + 12);
  const grupTimestamp = buffer.readUInt32LE(offset + 16);

  debugLog(`\n[grupHandler] Processing nested GRUP at offset ${offset}`);
  debugLog(`  Type: ${grupType}`);
  debugLog(`  Label: ${grupLabel}`);
  debugLog(`  Size: ${grupSize}`);
  debugLog(`  Timestamp: ${grupTimestamp}`);

  let currentOffset = offset + RECORD_HEADER.TOTAL_SIZE;
  const endOffset = offset + RECORD_HEADER.TOTAL_SIZE + grupSize;
  let recordCount = 0;

  while (currentOffset < endOffset) {
    // Check if we have enough bytes for a record header
    if (currentOffset + RECORD_HEADER.TOTAL_SIZE > endOffset) {
      debugLog(
        `[grupHandler] Not enough bytes remaining for a record header at offset ${currentOffset} (endOffset: ${endOffset})`
      );
      break;
    }

    const recordType = buffer.toString(
      "ascii",
      currentOffset,
      currentOffset + 4
    );
    debugLog(
      `[grupHandler] Processing nested at offset ${currentOffset}/${endOffset} (${Math.round(
        (currentOffset / endOffset) * 100
      )}%): type=${recordType}`
    );

    if (recordType === "GRUP") {
      // Process nested GRUP
      const nestedRecords = processNestedGRUP(
        buffer,
        currentOffset,
        pluginName
      );
      debugLog(
        `[grupHandler] Nested GRUP returned ${nestedRecords.length} records`
      );
      records.push(...nestedRecords);
      recordCount += nestedRecords.length;

      // Get the nested GRUP size
      const nestedGrupHeader = parseRecordHeader(
        buffer.slice(currentOffset, currentOffset + RECORD_HEADER.TOTAL_SIZE)
      );
      const oldOffset = currentOffset;
      currentOffset += RECORD_HEADER.TOTAL_SIZE + nestedGrupHeader.dataSize;
      debugLog(
        `[grupHandler] GRUP size: ${nestedGrupHeader.dataSize}, advancing offset: ${oldOffset} -> ${currentOffset}`
      );
    } else {
      // Process normal record
      const { record, newOffset } = processRecord(
        buffer,
        currentOffset,
        pluginName
      );
      if (record) {
        records.push(record);
        recordCount++;
        const recordSize = newOffset - currentOffset;
        debugLog(
          `[grupHandler] Added record of type ${record.meta.type} (size: ${recordSize} bytes)`
        );
      } else {
        debugLog(
          `[grupHandler] Record at offset ${currentOffset} was not processed (newOffset: ${newOffset})`
        );
        // If we hit the end of buffer, break out
        if (newOffset === buffer.length) {
          debugLog(
            `[grupHandler] Reached end of buffer, stopping nested GRUP processing`
          );
          break;
        }
      }
      currentOffset = newOffset;
    }
  }

  debugLog(`[grupHandler] Finished processing nested GRUP at offset ${offset}`);
  debugLog(`  Total records found: ${recordCount}`);
  debugLog(`  Records by type:`);
  const recordsByType = records.reduce((acc, record) => {
    acc[record.meta.type] = (acc[record.meta.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  Object.entries(recordsByType).forEach(([type, count]) => {
    debugLog(`    ${type}: ${count} records`);
  });

  return records;
}

export { parseGRUPHeader, validateGRUPSize };
