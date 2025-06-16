import { ParsedRecord } from "@lorerim/platform-types";
import { parseRecordHeader } from "../recordParser";
import { debugLog, parseGRUPHeader, validateGRUPSize } from "./grupUtils";
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
  try {
    const grupHeader = parseRecordHeader(
      buffer.slice(offset, offset + RECORD_HEADER.TOTAL_SIZE),
      offset
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

    while (currentOffset + RECORD_HEADER.TOTAL_SIZE <= endOffset) {
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

      try {
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
            buffer.slice(
              currentOffset,
              currentOffset + RECORD_HEADER.TOTAL_SIZE
            ),
            currentOffset
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
              buffer.slice(
                currentOffset,
                currentOffset + RECORD_HEADER.TOTAL_SIZE
              ),
              currentOffset
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
      } catch (error) {
        // Log error and continue processing
        debugLog(
          `[grupHandler.processGRUP] Error processing record at offset ${currentOffset}: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
        // Record error in stats
        statsCollector.recordError(`RecordError_${recordType}`);
        // Skip to next record
        const recordHeader = parseRecordHeader(
          buffer.slice(currentOffset, currentOffset + RECORD_HEADER.TOTAL_SIZE),
          currentOffset
        );
        currentOffset += RECORD_HEADER.TOTAL_SIZE + recordHeader.dataSize;
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
  } catch (error) {
    throw new Error(
      `Failed to process GRUP at offset ${offset} in ${pluginName}: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

function parseGrupHeaderInfo(buffer: Buffer, offset: number) {
  const grupHeader = parseRecordHeader(
    buffer.slice(offset, offset + RECORD_HEADER.TOTAL_SIZE)
  );
  let grupSize = grupHeader.dataSize;
  const grupLabel = buffer.toString("ascii", offset + 8, offset + 12);
  const grupTimestamp = buffer.readUInt32LE(offset + 16);

  if (offset + RECORD_HEADER.TOTAL_SIZE + grupSize > buffer.length) {
    debugLog(
      `[grupHandler.processNestedGRUP] GRUP size exceeds buffer bounds, truncating`
    );
    grupSize = buffer.length - offset - RECORD_HEADER.TOTAL_SIZE;
  }

  return { grupHeader, grupSize, grupLabel, grupTimestamp };
}

function processRecordInGrup(
  buffer: Buffer,
  currentOffset: number,
  endOffset: number,
  pluginName: string,
  statsCollector: StatsCollector
): { records: ParsedRecord[] } {
  const header = parseRecordHeader(
    buffer.slice(currentOffset, currentOffset + RECORD_HEADER.TOTAL_SIZE)
  );
  const { record } = processRecord(
    buffer,
    currentOffset,
    pluginName,
    statsCollector
  );

  return {
    records: record ? [record] : [],
  };
}

function handleUnsupportedRecordType(
  buffer: Buffer,
  currentOffset: number,
  endOffset: number,
  recordType: string,
  statsCollector: StatsCollector
): void {
  const recordHeader = parseRecordHeader(
    buffer.slice(currentOffset, currentOffset + RECORD_HEADER.TOTAL_SIZE)
  );

  statsCollector.recordSkipped(
    recordType,
    recordHeader.dataSize + RECORD_HEADER.TOTAL_SIZE
  );

  debugLog(
    `[grupHandler.processNestedGRUP] Skipping unsupported record type: ${recordType}`
  );
}

function logGrupProcessingResults(offset: number, records: ParsedRecord[]) {
  debugLog(
    `[grupHandler.processNestedGRUP] Finished processing nested GRUP at offset ${offset}`
  );
  debugLog(`  Total records found: ${records.length}`);
  debugLog(`  Records by type:`);
  const recordsByType = records.reduce((acc, record) => {
    acc[record.meta.type] = (acc[record.meta.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  Object.entries(recordsByType).forEach(([type, count]) => {
    debugLog(`    ${type}: ${count} records`);
  });
}

export function processNestedGRUP(
  buffer: Buffer,
  offset: number,
  pluginName: string,
  statsCollector: StatsCollector
): ParsedRecord[] {
  const records: ParsedRecord[] = [];
  const { grupSize, grupLabel, grupTimestamp } = parseGrupHeaderInfo(
    buffer,
    offset
  );

  debugLog(
    `\n[grupHandler.processNestedGRUP] Processing nested GRUP at offset ${offset}`
  );
  debugLog(`  Label: ${grupLabel}`);
  debugLog(`  Size: ${grupSize}`);
  debugLog(`  Timestamp: ${grupTimestamp}`);

  let currentOffset = offset + RECORD_HEADER.TOTAL_SIZE;
  const endOffset = offset + RECORD_HEADER.TOTAL_SIZE + grupSize;
  let loopCount = 0;
  const maxIterations = 10000;

  while (currentOffset < endOffset && loopCount++ < maxIterations) {
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

    // Calculate the size of the current record/GRUP
    const header = parseRecordHeader(
      buffer.slice(currentOffset, currentOffset + RECORD_HEADER.TOTAL_SIZE)
    );
    const recordSize = header.dataSize + RECORD_HEADER.TOTAL_SIZE;
    const newOffset = currentOffset + recordSize;

    if (newOffset > endOffset) {
      debugLog(
        `[grupHandler.processNestedGRUP] Record exceeds GRUP bounds, stopping`
      );
      break;
    }

    if (!PROCESSED_RECORD_TYPES.has(recordType as ProcessedRecordType)) {
      handleUnsupportedRecordType(
        buffer,
        currentOffset,
        endOffset,
        recordType,
        statsCollector
      );
      currentOffset = newOffset;
      continue;
    }

    if (recordType === "GRUP") {
      const nestedRecords = processNestedGRUP(
        buffer,
        currentOffset,
        pluginName,
        statsCollector
      );
      records.push(...nestedRecords);
    } else {
      const { records: newRecords } = processRecordInGrup(
        buffer,
        currentOffset,
        endOffset,
        pluginName,
        statsCollector
      );
      records.push(...newRecords);
    }

    currentOffset = newOffset;
  }

  if (loopCount >= maxIterations) {
    debugLog(
      `[grupHandler.processNestedGRUP] Max loop iterations exceeded at offset ${offset}`
    );
    statsCollector.recordError(`MaxIterationsExceeded_${grupLabel}`);
  }

  logGrupProcessingResults(offset, records);
  return records;
}

export { parseGRUPHeader, validateGRUPSize };
