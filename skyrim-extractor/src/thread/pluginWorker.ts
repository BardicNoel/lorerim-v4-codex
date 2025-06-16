// src/thread/pluginWorker.ts
import { parentPort } from "worker_threads";
import { readFile } from "fs/promises";
import { PluginMeta } from "../types";
import {
  RECORD_HEADER,
  GRUP_HEADER,
} from "../binary-decoders/buffer.constants";
import { parseRecordHeader } from "../binary-decoders/recordParser";
import {
  parseGRUPHeader,
  processGRUP,
} from "../binary-decoders/grup/grupHandler";
import { processRecord } from "../utils/recordProcessor";
import { ParsedRecord } from "@lorerim/platform-types";
import { StatsCollector } from "../utils/stats";

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
  const statsCollector = new StatsCollector();

  console.log(`\n[Worker] Processing plugin: ${plugin.name}`);

  while (offset < buffer.length) {
    const recordType = buffer.toString("ascii", offset, offset + 4);

    if (recordType === "GRUP") {
      // Process GRUP and get all records from it
      const grupRecords = processGRUP(
        buffer,
        offset,
        plugin.name,
        statsCollector
      );
      records.push(...grupRecords);

      // Get the GRUP size from its header
      const grupHeader = parseGRUPHeader(buffer, offset);
      offset += RECORD_HEADER.TOTAL_SIZE + grupHeader.size;
    } else {
      // Process normal record
      const { record, newOffset } = processRecord(
        buffer,
        offset,
        plugin.name,
        statsCollector
      );
      if (record) {
        records.push(record);
      }
      offset = newOffset;
    }
  }

  console.log(
    `[Worker] Completed ${plugin.name}: ${records.length} records processed`
  );
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
      const errorStack = error instanceof Error ? error.stack : undefined;

      console.error(`[Worker] Error in ${message.plugin.name}:`, errorMessage);

      // Send error message to main thread
      if (parentPort) {
        parentPort.postMessage({
          type: "error",
          message: `Failed to process plugin ${message.plugin.name}`,
          error: errorMessage,
          stack: errorStack,
        });
      }

      // Exit with error code
      process.exit(1);
    }
  });
} else {
  console.error("CRITICAL: Cannot set up message handler - parentPort is null");
  process.exit(1);
}
