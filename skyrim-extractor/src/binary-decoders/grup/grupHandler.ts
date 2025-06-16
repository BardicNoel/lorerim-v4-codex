import { ParsedRecord } from "@lorerim/platform-types";
import { parseRecordHeader } from "../recordParser";
import {
  debugLog,
  dumpHex,
  getGroupTypeName,
  errorLog,
  parseGRUPHeader,
  validateGRUPSize,
} from "./grupUtils";
import { RECORD_HEADER } from "../buffer.constants";
import { processRecord } from "../../utils/recordProcessor";
import { PROCESSED_RECORD_TYPES, ProcessedRecordType } from "../../constants";
import { StatsCollector } from "../../utils/stats";

export function processGRUP(
  buffer: Buffer,
  offset: number,
  pluginName: string,
  statsCollector: StatsCollector
): ParsedRecord[] {
  const records: ParsedRecord[] = [];
  const grupHeader = parseRecordHeader(
    buffer.slice(offset, offset + RECORD_HEADER.TOTAL_SIZE)
  );
  const grupSize = grupHeader.dataSize;
  const grupLabel = buffer.toString("ascii", offset + 8, offset + 12);
  const grupTimestamp = buffer.readUInt32LE(offset + 16);

  debugLog(`\n[grupHandler.processGRUP] Processing GRUP at offset ${offset}`);
  debugLog(`  Label: ${grupLabel}`);
  debugLog(`  Size: ${grupSize}`);
  debugLog(`  Timestamp: ${grupTimestamp}`);

  if (!PROCESSED_RECORD_TYPES.has(grupLabel as ProcessedRecordType)) {
    debugLog(
      `[grupHandler.processGRUP] Skipping GRUP with unsupported record type: ${grupLabel}`
    );
    // Record skip in stats
    statsCollector.recordSkipped(
      grupLabel,
      grupSize + RECORD_HEADER.TOTAL_SIZE
    );
    return [];
  }

  // Process all GRUPs since the label can be corrupted by CK's ignore flag
  // Individual record types will be checked during processing
  let currentOffset = offset + RECORD_HEADER.TOTAL_SIZE;
  const endOffset = offset + RECORD_HEADER.TOTAL_SIZE + grupSize;
  let recordCount = 0;

  while (currentOffset < endOffset) {
    if (currentOffset + RECORD_HEADER.TOTAL_SIZE > endOffset) {
      debugLog(
        `[grupHandler.processGRUP] Not enough bytes remaining for a record header at offset ${currentOffset} (endOffset: ${endOffset})`
      );
      break;
    }

    const recordType = buffer.toString(
      "ascii",
      currentOffset,
      currentOffset + 4
    );
    debugLog(
      `[grupHandler.processGRUP] Processing at offset ${currentOffset}/${endOffset} (${Math.round(
        (currentOffset / endOffset) * 100
      )}%): type=${recordType}`
    );

    if (recordType === "GRUP") {
      const nestedRecords = processNestedGRUP(
        buffer,
        currentOffset,
        pluginName,
        statsCollector
      );
      debugLog(
        `[grupHandler.processGRUP] Nested GRUP returned ${nestedRecords.length} records`
      );
      records.push(...nestedRecords);
      recordCount += nestedRecords.length;

      const nestedGrupHeader = parseRecordHeader(
        buffer.slice(currentOffset, currentOffset + RECORD_HEADER.TOTAL_SIZE)
      );
      const oldOffset = currentOffset;
      currentOffset += RECORD_HEADER.TOTAL_SIZE + nestedGrupHeader.dataSize;
      debugLog(
        `[grupHandler.processGRUP] GRUP size: ${nestedGrupHeader.dataSize}, advancing offset: ${oldOffset} -> ${currentOffset}`
      );
    } else {
      const { record, newOffset } = processRecord(
        buffer,
        currentOffset,
        pluginName,
        statsCollector
      );
      if (record) {
        records.push(record);
        recordCount++;
        const recordSize = newOffset - currentOffset;
        debugLog(
          `[grupHandler.processGRUP] Added record of type ${record.meta.type} (size: ${recordSize} bytes)`
        );
      } else {
        // Record was skipped, record it in stats
        const recordHeader = parseRecordHeader(
          buffer.slice(currentOffset, currentOffset + RECORD_HEADER.TOTAL_SIZE)
        );
        statsCollector.recordSkipped(
          recordType,
          recordHeader.dataSize + RECORD_HEADER.TOTAL_SIZE
        );

        debugLog(
          `[grupHandler.processGRUP] Record at offset ${currentOffset} was not processed (newOffset: ${newOffset})`
        );
        if (newOffset === buffer.length) {
          debugLog(
            `[grupHandler.processGRUP] Reached end of buffer, stopping GRUP processing`
          );
          break;
        }
      }
      currentOffset = newOffset;
    }
  }

  debugLog(
    `[grupHandler.processGRUP] Finished processing GRUP at offset ${offset}`
  );
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

function processNestedGRUP(
  buffer: Buffer,
  offset: number,
  pluginName: string,
  statsCollector: StatsCollector
): ParsedRecord[] {
  const records: ParsedRecord[] = [];
  const grupHeader = parseRecordHeader(
    buffer.slice(offset, offset + RECORD_HEADER.TOTAL_SIZE)
  );
  let grupSize = grupHeader.dataSize;
  const grupLabel = buffer.toString("ascii", offset + 8, offset + 12);
  const grupTimestamp = buffer.readUInt32LE(offset + 16);

  debugLog(
    `\n[grupHandler.processNestedGRUP] Processing nested GRUP at offset ${offset}`
  );
  debugLog(`  Label: ${grupLabel}`);
  debugLog(`  Size: ${grupSize}`);
  debugLog(`  Timestamp: ${grupTimestamp}`);

  if (offset + RECORD_HEADER.TOTAL_SIZE + grupSize > buffer.length) {
    debugLog(
      `[grupHandler.processNestedGRUP] GRUP size exceeds buffer bounds, truncating`
    );
    grupSize = buffer.length - offset - RECORD_HEADER.TOTAL_SIZE;
  }

  let currentOffset = offset + RECORD_HEADER.TOTAL_SIZE;
  const endOffset = offset + RECORD_HEADER.TOTAL_SIZE + grupSize;
  let recordCount = 0;

  while (currentOffset < endOffset) {
    if (currentOffset + RECORD_HEADER.TOTAL_SIZE > endOffset) {
      debugLog(
        `[grupHandler.processNestedGRUP] Not enough bytes remaining for a record header at offset ${currentOffset} (endOffset: ${endOffset})`
      );
      break;
    }

    const recordType = buffer.toString(
      "ascii",
      currentOffset,
      currentOffset + 4
    );

    if (!PROCESSED_RECORD_TYPES.has(recordType as ProcessedRecordType)) {
      const recordHeader = parseRecordHeader(
        buffer.slice(currentOffset, currentOffset + RECORD_HEADER.TOTAL_SIZE)
      );
      const newOffset =
        currentOffset + RECORD_HEADER.TOTAL_SIZE + recordHeader.dataSize;
      if (newOffset > endOffset) {
        debugLog(
          `[grupHandler.processNestedGRUP] Record exceeds GRUP bounds, stopping`
        );
        break;
      }
      // Record skip in stats
      statsCollector.recordSkipped(
        recordType,
        recordHeader.dataSize + RECORD_HEADER.TOTAL_SIZE
      );
      currentOffset = newOffset;
      debugLog(
        `[grupHandler.processNestedGRUP] Skipping unsupported record type: ${recordType}`
      );
      continue;
    }

    if (recordType === "GRUP") {
      const nestedGrupHeader = parseRecordHeader(
        buffer.slice(currentOffset, currentOffset + RECORD_HEADER.TOTAL_SIZE)
      );
      const nestedGrupSize = nestedGrupHeader.dataSize;

      if (
        currentOffset + RECORD_HEADER.TOTAL_SIZE + nestedGrupSize >
        endOffset
      ) {
        debugLog(
          `[grupHandler.processNestedGRUP] Nested GRUP exceeds parent GRUP bounds, stopping`
        );
        break;
      }

      const nestedRecords = processNestedGRUP(
        buffer,
        currentOffset,
        pluginName,
        statsCollector
      );
      records.push(...nestedRecords);
      recordCount += nestedRecords.length;
      currentOffset += RECORD_HEADER.TOTAL_SIZE + nestedGrupSize;
    } else {
      const { record, newOffset } = processRecord(
        buffer,
        currentOffset,
        pluginName,
        statsCollector
      );
      if (record) {
        records.push(record);
        recordCount++;
      } else {
        // Record was skipped, record it in stats
        const recordHeader = parseRecordHeader(
          buffer.slice(currentOffset, currentOffset + RECORD_HEADER.TOTAL_SIZE)
        );
        statsCollector.recordSkipped(
          recordType,
          recordHeader.dataSize + RECORD_HEADER.TOTAL_SIZE
        );
      }

      if (newOffset > endOffset) {
        debugLog(
          `[grupHandler.processNestedGRUP] Record processing exceeded GRUP bounds, stopping`
        );
        break;
      }
      currentOffset = newOffset;
    }
  }

  debugLog(
    `[grupHandler.processNestedGRUP] Finished processing nested GRUP at offset ${offset}`
  );
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
