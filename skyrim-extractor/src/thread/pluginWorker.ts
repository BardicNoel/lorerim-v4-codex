// src/thread/pluginWorker.ts
import { parentPort } from "worker_threads";
import { readFile, writeFile } from "fs/promises";
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
    // Create detailed error context
    const errorContext = {
      message,
      error: error?.message || error,
      stack: error?.stack,
      timestamp: new Date().toISOString(),
      type: error?.name || "UnknownError",
    };

    // Write detailed error to file
    const errorLog = `[${errorContext.timestamp}] ERROR
Type: ${errorContext.type}
Message: ${errorContext.message}
Error: ${errorContext.error}
Stack: ${errorContext.stack}
----------------------------------------\n`;

    writeFile("error.log", errorLog, { flag: "a" }).catch((err) => {
      console.error("Failed to write to error.log:", err);
    });

    // Send to main thread
    parentPort.postMessage({
      type: "error",
      message,
      error: errorContext,
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
  let buffer: Buffer;

  try {
    console.log(`[Worker] Reading file: ${plugin.fullPath}`);
    buffer = await readFile(plugin.fullPath);
    console.log(
      `[Worker] Successfully read file: ${plugin.fullPath} (${buffer.length} bytes)`
    );
  } catch (error) {
    console.error(`[Worker] Failed to read file: ${plugin.fullPath}`, error);
    throw new Error(
      `Failed to read plugin file: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }

  let offset = 0;
  const statsCollector = new StatsCollector();

  console.log(`\n[Worker] Processing plugin: ${plugin.name}`);

  try {
    while (offset < buffer.length) {
      try {
        const recordType = buffer.toString("ascii", offset, offset + 4);
        console.log(
          `[Worker] Processing record at offset ${offset}: ${recordType}`
        );

        if (recordType === "GRUP") {
          // Process GRUP and get all records from it
          const grupRecords = processGRUP(
            buffer,
            offset,
            plugin.name,
            statsCollector
          );
          records.push(...grupRecords);
          console.log(
            `[Worker] Processed GRUP at offset ${offset}: ${grupRecords.length} records`
          );

          // Get the GRUP size from its header
          const grupHeader = parseRecordHeader(
            buffer.slice(offset, offset + RECORD_HEADER.TOTAL_SIZE),
            offset
          );
          offset += RECORD_HEADER.TOTAL_SIZE + grupHeader.dataSize;
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
            console.log(
              `[Worker] Processed record at offset ${offset}: ${record.meta.type}`
            );
          }
          offset = newOffset;
        }
      } catch (error) {
        // Create detailed error context
        const errorContext = {
          plugin: plugin.name,
          offset: offset,
          recordType: buffer.toString("ascii", offset, offset + 4),
          bufferContext: buffer
            .slice(Math.max(0, offset - 32), offset + 32)
            .toString("hex"),
          bufferAtOffset: buffer.slice(offset, offset + 64).toString("hex"),
          error: error instanceof Error ? error.message : "Unknown error",
          stack: error instanceof Error ? error.stack : undefined,
          timestamp: new Date().toISOString(),
        };

        console.error(
          `[Worker] Error processing record at offset ${offset}:`,
          error
        );

        // Log detailed error to file
        const errorLog = `[${errorContext.timestamp}] RECORD ERROR
Plugin: ${errorContext.plugin}
Offset: ${errorContext.offset}
Record Type: ${errorContext.recordType}
Buffer Context (32 bytes before and after offset):
${errorContext.bufferContext}
Buffer at Offset (64 bytes):
${errorContext.bufferAtOffset}
Error: ${errorContext.error}
Stack: ${errorContext.stack}
----------------------------------------\n`;

        // Write to error log file
        await writeFile("error.log", errorLog, { flag: "a" });

        // Record error in stats
        statsCollector.recordError(`RecordError_${errorContext.recordType}`);

        // Send error to main thread
        if (parentPort) {
          parentPort.postMessage({
            type: "error",
            message: `Error processing record at offset ${offset}`,
            error: errorContext,
          });
        }

        // Try to recover by finding the next record
        const nextRecordOffset = findNextRecord(buffer, offset);
        if (nextRecordOffset === -1) {
          console.error(
            `[Worker] Could not find next record after error at offset ${offset}`
          );
          break;
        }
        offset = nextRecordOffset;
      }
    }

    console.log(
      `[Worker] Completed ${plugin.name}: ${records.length} records processed`
    );
    return records;
  } catch (error) {
    // Create detailed error context for fatal errors
    const errorContext = {
      plugin: plugin.name,
      offset: offset,
      recordType: buffer.toString("ascii", offset, offset + 4),
      bufferContext: buffer
        .slice(Math.max(0, offset - 32), offset + 32)
        .toString("hex"),
      bufferAtOffset: buffer.slice(offset, offset + 64).toString("hex"),
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    };

    console.error(`[Worker] Fatal error processing ${plugin.name}:`, error);

    // Log detailed error to file
    const errorLog = `[${errorContext.timestamp}] FATAL ERROR
Plugin: ${errorContext.plugin}
Offset: ${errorContext.offset}
Record Type: ${errorContext.recordType}
Buffer Context (32 bytes before and after offset):
${errorContext.bufferContext}
Buffer at Offset (64 bytes):
${errorContext.bufferAtOffset}
Error: ${errorContext.error}
Stack: ${errorContext.stack}
----------------------------------------\n`;

    // Write to error log file
    await writeFile("error.log", errorLog, { flag: "a" });

    // Send error to main thread
    if (parentPort) {
      parentPort.postMessage({
        type: "error",
        message: `Failed to process ${plugin.name}`,
        error: errorContext,
      });
    }

    throw error; // Let the outer try-catch handle the exit
  }
}

/**
 * Find the next valid record in the buffer
 */
function findNextRecord(buffer: Buffer, startOffset: number): number {
  const RECORD_SIGNATURES = [
    "TES4",
    "GRUP",
    "GMST",
    "KYWD",
    "LCRT",
    "AACT",
    "TXST",
    "MICN",
    "GLOB",
    "CLAS",
    "FACT",
    "HDPT",
    "EYES",
    "RACE",
    "SOUN",
    "ASPC",
    "SKIL",
    "MGEF",
    "SCPT",
    "LTEX",
    "ENCH",
    "SPEL",
    "SCRL",
    "ACTI",
    "TACT",
    "ARMO",
    "BOOK",
    "CONT",
    "DOOR",
    "INGR",
    "LIGH",
    "MISC",
    "STAT",
    "SNDR",
    "GRAS",
    "TREE",
    "FLOR",
    "FURN",
    "WEAP",
    "AMMO",
    "NPC_",
    "LVLN",
    "LVLC",
    "KEYM",
    "ALCH",
    "IDLM",
    "NOTE",
    "COBJ",
    "PROJ",
    "HAZD",
    "SLGM",
    "LVLI",
    "WTHR",
    "CLMT",
    "SPGD",
    "RFCT",
    "REGN",
    "NAVI",
    "CELL",
    "WRLD",
    "DIAL",
    "QUST",
    "IDLE",
    "PACK",
    "CSTY",
    "LSCR",
    "LVSP",
    "ANIO",
    "WATR",
    "EFSH",
    "TOFT",
    "EXPL",
    "DEBR",
    "IMGS",
    "IMAD",
    "FLST",
    "PERK",
    "BPTD",
    "ADDN",
    "AVIF",
    "CAMS",
    "CPTH",
    "VTYP",
    "MATT",
    "IPCT",
    "IPDS",
    "ARMA",
    "ECZN",
    "LCTN",
    "MESG",
    "RGDL",
    "DOBJ",
    "LGTM",
    "MUSC",
    "FSTP",
    "FSTS",
    "SMBN",
    "SMQN",
    "SMEN",
    "DLBR",
    "MUST",
    "DLVW",
    "WOOP",
    "SHOU",
    "EQUP",
    "RELA",
    "SCEN",
    "ASTP",
    "OTFT",
    "ARTO",
    "MATO",
    "MOVT",
    "SNDR",
    "DUAL",
    "SNCT",
    "SOPM",
    "COLL",
    "CLFM",
    "REVB",
    "PKIN",
    "RFGP",
    "AMDL",
    "LAYR",
    "COBJ",
    "OMOD",
    "MSWP",
    "ZOOM",
    "INNR",
    "KSSM",
    "AECH",
    "SCCO",
    "AORU",
    "SCSN",
    "STND",
    "LMSW",
    "PWAT",
    "ANIO",
    "WATR",
    "EFSH",
    "TOFT",
    "EXPL",
    "DEBR",
    "IMGS",
    "IMAD",
    "FLST",
    "PERK",
    "BPTD",
    "ADDN",
    "AVIF",
    "CAMS",
    "CPTH",
    "VTYP",
    "MATT",
    "IPCT",
    "IPDS",
    "ARMA",
    "ECZN",
    "LCTN",
    "MESG",
    "RGDL",
    "DOBJ",
    "LGTM",
    "MUSC",
    "FSTP",
    "FSTS",
    "SMBN",
    "SMQN",
    "SMEN",
    "DLBR",
    "MUST",
    "DLVW",
    "WOOP",
    "SHOU",
    "EQUP",
    "RELA",
    "SCEN",
    "ASTP",
    "OTFT",
    "ARTO",
    "MATO",
    "MOVT",
    "SNDR",
    "DUAL",
    "SNCT",
    "SOPM",
    "COLL",
    "CLFM",
    "REVB",
    "PKIN",
    "RFGP",
    "AMDL",
    "LAYR",
    "COBJ",
    "OMOD",
    "MSWP",
    "ZOOM",
    "INNR",
    "KSSM",
    "AECH",
    "SCCO",
    "AORU",
    "SCSN",
    "STND",
    "LMSW",
    "PWAT",
  ];

  for (let i = startOffset; i < buffer.length - 4; i++) {
    const signature = buffer.toString("ascii", i, i + 4);
    if (RECORD_SIGNATURES.includes(signature)) {
      return i;
    }
  }
  return -1;
}

// Handle messages from the main thread
if (parentPort) {
  parentPort.on("message", async (message: { plugin: PluginMeta }) => {
    try {
      // Log start of processing
      const startLog = `[${new Date().toISOString()}] Starting plugin: ${
        message.plugin.name
      }
Full Path: ${message.plugin.fullPath}
Index: ${message.plugin.index}
----------------------------------------\n`;
      await writeFile("error.log", startLog, { flag: "a" });

      console.log(`[Worker] Starting to process ${message.plugin.name}`);
      const records = await processPlugin(message.plugin);
      console.log(
        `[Worker] Successfully processed ${message.plugin.name} with ${records.length} records`
      );

      if (parentPort) {
        parentPort.postMessage({ status: "done", records });
      }

      // Exit with success code
      process.exit(0);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      const errorStack =
        error instanceof Error ? error.stack : "No stack trace available";

      // Log worker exit error with full context
      const errorLog = `[${new Date().toISOString()}] WORKER EXIT ERROR - Plugin: ${
        message.plugin.name
      }
Full Path: ${message.plugin.fullPath}
Index: ${message.plugin.index}
Error: ${errorMessage}
Stack: ${errorStack}
----------------------------------------\n`;

      // Write to error log file
      await writeFile("error.log", errorLog, { flag: "a" });

      // Send error message to main thread
      if (parentPort) {
        parentPort.postMessage({
          type: "error",
          message: errorMessage,
          error: {
            message: errorMessage,
            stack: errorStack,
            plugin: message.plugin.name,
            timestamp: new Date().toISOString(),
          },
        });
      }

      // Exit with error code
      process.exit(1);
    }
  });
} else {
  const errorLog = `[${new Date().toISOString()}] CRITICAL ERROR - Cannot set up message handler
Error: parentPort is null
----------------------------------------\n`;
  writeFile("error.log", errorLog, { flag: "a" });
  process.exit(1);
}
