// src/thread/pluginWorker.ts
import { parentPort } from "worker_threads";
import { readFile } from "fs/promises";
import { PluginMeta, ParsedRecord } from "../types";
import { processGRUP } from "../utils/grup/grupHandler";
import { logGRUPFields } from "../utils/debugUtils";
import { RECORD_HEADER, GRUP_HEADER } from "../utils/buffer.constants";
import { parseRecordHeader, scanSubrecords } from "../utils/recordParser";
import { appendFileSync } from "fs";

interface ProcessResult {
  records: ParsedRecord[];
  newOffset: number;
}

// Debug logging function
function debugLog(message: string, data?: any) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}`;
  console.log(logMessage, data);
  appendFileSync(
    "thread-debug.txt",
    `[${new Date().toISOString()}] ${message}\n`
  );

  if (!parentPort) {
    console.error(
      "WARNING: parentPort is null, debug message not sent:",
      logMessage,
      data
    );
    return;
  }

  try {
    console.log("Sending debug message to parent:", {
      type: "debug",
      message: logMessage,
      data,
    });
    parentPort.postMessage({ type: "debug", message: logMessage, data });
  } catch (error) {
    console.error("Error sending debug message:", error);
  }
}

// Error logging function
function errorLog(message: string, error?: any) {
  const errorMessage = `[Error] ${message}`;
  console.error(errorMessage, error);

  if (!parentPort) {
    console.error(
      "WARNING: parentPort is null, error message not sent:",
      errorMessage,
      error
    );
    return;
  }

  try {
    parentPort.postMessage({
      type: "error",
      message,
      error: error?.message || error,
    });
  } catch (err) {
    console.error("Error sending error message:", err);
  }
}

// Log worker initialization
console.log("Worker thread starting...");
if (!parentPort) {
  console.error(
    "CRITICAL: parentPort is null - worker is not properly initialized"
  );
} else {
  console.log("Worker thread initialized with parentPort");
}

// Process a GRUP record
async function processGRUPRecord(
  buffer: Buffer,
  offset: number,
  pluginName: string
): Promise<ProcessResult> {
  debugLog(`Processing GRUP at offset ${offset}`, {
    pluginName,
    offset,
    bufferSize: buffer.length,
    headerPreview: buffer.slice(offset, offset + 24).toString("hex"),
  });
  const parsedRecords = await processGRUP(buffer, offset, pluginName);
  debugLog(`GRUP processed, found ${parsedRecords.length} records`, {
    pluginName,
    recordCount: parsedRecords.length,
    recordTypes: [...new Set(parsedRecords.map((r) => r.meta.type))],
  });
  return {
    records: parsedRecords,
    newOffset: offset + GRUP_HEADER.TOTAL_SIZE,
  };
}

// Process a TES4 record
async function processTES4Record(
  buffer: Buffer,
  offset: number,
  pluginName: string
): Promise<ProcessResult> {
  debugLog(`Processing TES4 record at offset ${offset}`, {
    pluginName,
    offset,
    bufferSize: buffer.length,
    headerPreview: buffer.slice(offset, offset + 24).toString("hex"),
  });
  const records: ParsedRecord[] = [];
  const header = buffer.slice(offset, offset + RECORD_HEADER.TOTAL_SIZE);
  const size = header.readUInt32LE(RECORD_HEADER.OFFSETS.SIZE);
  const newOffset = offset + RECORD_HEADER.TOTAL_SIZE + size;
  debugLog(`TES4 record processed, size: ${size}`, {
    pluginName,
    size,
    newOffset,
    headerPreview: header.toString("hex"),
  });
  return { records, newOffset };
}

// Process a normal record
async function processNormalRecord(
  buffer: Buffer,
  offset: number,
  pluginName: string
): Promise<ProcessResult> {
  debugLog(`Processing normal record at offset ${offset}`);
  const records: ParsedRecord[] = [];
  const header = buffer.slice(offset, offset + RECORD_HEADER.TOTAL_SIZE);
  const size = header.readUInt32LE(RECORD_HEADER.OFFSETS.SIZE);
  const newOffset = offset + RECORD_HEADER.TOTAL_SIZE + size;
  debugLog(`Normal record processed, size: ${size}`);
  return { records, newOffset };
}

// Process the plugin file
export async function processPlugin(
  plugin: PluginMeta
): Promise<ParsedRecord[]> {
  const records: ParsedRecord[] = [];
  const buffer = await readFile(plugin.fullPath);
  let offset = 0;

  // Log start of plugin processing
  debugLog(`Starting to process plugin: ${plugin.name}`, {
    pluginName: plugin.name,
    bufferSize: buffer.length,
  });

  while (offset < buffer.length) {
    debugLog(`Attempting to parse record at offset ${offset}`, {
      pluginName: plugin.name,
      remainingBytes: buffer.length - offset,
      bufferPreview: buffer.slice(offset, offset + 24).toString("hex"),
    });

    const header = parseRecordHeader(buffer.slice(offset));
    if (!header) {
      debugLog(`Failed to parse record header at offset ${offset}`, {
        pluginName: plugin.name,
        offset,
        bufferPreview: buffer.slice(offset, offset + 24).toString("hex"),
      });
      break;
    }

    debugLog(`Processing record at offset ${offset}`, {
      pluginName: plugin.name,
      recordType: header.type,
      formId: header.formId.toString(16).padStart(8, "0").toUpperCase(),
      offset,
      size: header.dataSize,
      headerPreview: buffer
        .slice(offset, offset + RECORD_HEADER.TOTAL_SIZE)
        .toString("hex"),
    });

    const subrecordResult = scanSubrecords(
      buffer.slice(offset + RECORD_HEADER.TOTAL_SIZE),
      0
    );
    const record: ParsedRecord = {
      meta: {
        type: header.type,
        formId: header.formId.toString(16).padStart(8, "0").toUpperCase(),
        plugin: plugin.name,
      },
      data: {},
      header: buffer
        .slice(offset, offset + RECORD_HEADER.TOTAL_SIZE)
        .toString("base64"),
    };

    debugLog(`Found ${subrecordResult.subrecords.length} subrecords`, {
      pluginName: plugin.name,
      recordType: header.type,
      formId: record.meta.formId,
      subrecordCount: subrecordResult.subrecords.length,
      subrecordTypes: subrecordResult.subrecords.map((s) => s.header.type),
    });

    for (const { header, offset: subOffset } of subrecordResult.subrecords) {
      const start = offset + RECORD_HEADER.TOTAL_SIZE + subOffset;
      const end = start + header.size;
      const subrecordData = buffer.slice(start, end);

      if (!record.data[header.type]) {
        record.data[header.type] = [];
      }

      debugLog(`Processing subrecord`, {
        pluginName: plugin.name,
        recordType: record.meta.type,
        formId: record.meta.formId,
        subrecordType: header.type,
        start,
        end,
        size: header.size,
        actualSize: subrecordData.length,
        bufferPreview: subrecordData.toString("hex").slice(0, 64),
      });

      record.data[header.type].push(subrecordData);
    }

    records.push(record);
    offset += RECORD_HEADER.TOTAL_SIZE + header.dataSize;
  }

  // Log completion of plugin processing
  debugLog(`Completed processing plugin: ${plugin.name}`, {
    pluginName: plugin.name,
    totalRecords: records.length,
  });

  return records;
}

// Handle messages from the main thread
if (parentPort) {
  console.log("Setting up message handler...");
  parentPort.on("message", async (message: { plugin: PluginMeta }) => {
    try {
      debugLog(`Received plugin to process: ${message.plugin.name}`);
      const records = await processPlugin(message.plugin);
      debugLog(`Successfully processed ${message.plugin.name}`);
      if (parentPort) {
        parentPort.postMessage({ status: "done", records });
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      errorLog(`Error processing plugin ${message.plugin.name}`, errorMessage);
      if (parentPort) {
        parentPort.postMessage({ status: "error", error: errorMessage });
      }
    }
  });
  console.log("Message handler setup complete");
} else {
  console.error("CRITICAL: Cannot set up message handler - parentPort is null");
}
