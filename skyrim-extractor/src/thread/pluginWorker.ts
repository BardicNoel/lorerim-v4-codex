// src/thread/pluginWorker.ts
import { parentPort } from "worker_threads";
import { readFile } from "fs/promises";
import { PluginMeta, ParsedRecord } from "../types";
import { processGRUP } from "../utils/grup/grupHandler";
import { logGRUPFields } from "../utils/debugUtils";
import { RECORD_HEADER, GRUP_HEADER } from "../utils/buffer.constants";
import { parseRecordHeader } from "../utils/recordParser";
import { processRecord } from "../utils/recordProcessor";
import { appendFileSync } from "fs";

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

    const recordType = buffer.toString("ascii", offset, offset + 4);
    debugLog(`Found record type: ${recordType}`);

    if (recordType === "GRUP") {
      // Process GRUP and get all records from it
      const grupRecords = processGRUP(buffer, offset, plugin.name);
      records.push(...grupRecords);

      // Get the GRUP size from its header
      const grupHeader = parseRecordHeader(
        buffer.slice(offset, offset + RECORD_HEADER.TOTAL_SIZE)
      );
      offset += RECORD_HEADER.TOTAL_SIZE + grupHeader.dataSize;
    } else {
      // Process normal record
      const { record, newOffset } = processRecord(buffer, offset, plugin.name);
      if (record) {
        records.push(record);
      }
      offset = newOffset;
    }
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
