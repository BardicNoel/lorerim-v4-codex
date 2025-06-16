// src/thread/pluginWorker.ts
import { parentPort } from "worker_threads";
import { readFile } from "fs/promises";
import { PluginMeta, ParsedRecord } from "../types";
import { parseGRUPHeader, processGRUP } from "../utils/grup/grupHandler";
import { RECORD_HEADER, GRUP_HEADER } from "../utils/buffer.constants";
import { parseRecordHeader } from "../utils/recordParser";
import { processRecord } from "../utils/recordProcessor";

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

// Process the plugin file
export async function processPlugin(
  plugin: PluginMeta
): Promise<ParsedRecord[]> {
  const records: ParsedRecord[] = [];
  const buffer = await readFile(plugin.fullPath);
  let offset = 0;

  while (offset < buffer.length) {
    const recordType = buffer.toString("ascii", offset, offset + 4);

    if (recordType === "GRUP") {
      // Process GRUP and get all records from it
      const grupRecords = processGRUP(buffer, offset, plugin.name);
      records.push(...grupRecords);

      // Get the GRUP size from its header
      const grupHeader = parseGRUPHeader(buffer, offset);
      offset += RECORD_HEADER.TOTAL_SIZE + grupHeader.size;
    } else {
      // Process normal record
      const { record, newOffset } = processRecord(buffer, offset, plugin.name);
      if (record) {
        records.push(record);
      }
      offset = newOffset;
    }
  }

  return records;
}

// Handle messages from the main thread
if (parentPort) {
  parentPort.on("message", async (message: { plugin: PluginMeta }) => {
    try {
      const records = await processPlugin(message.plugin);
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
} else {
  console.error("CRITICAL: Cannot set up message handler - parentPort is null");
}
