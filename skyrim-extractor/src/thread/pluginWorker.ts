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

  try {
    while (offset < buffer.length) {
      try {
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
          }
          offset = newOffset;
        }
      } catch (error) {
        // Log error and continue processing
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
        };

        // Log detailed error to file
        const errorLog = `[${new Date().toISOString()}] RECORD ERROR - Plugin: ${
          errorContext.plugin
        }
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
  } catch (error) {
    // This is for fatal errors that prevent further processing
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
    };

    // Log detailed error to file
    const errorLog = `[${new Date().toISOString()}] FATAL ERROR - Plugin: ${
      errorContext.plugin
    }
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
    throw new Error(
      `Failed to process ${plugin.name}: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }

  console.log(
    `[Worker] Completed ${plugin.name}: ${records.length} records processed`
  );
  return records;
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

      const records = await processPlugin(message.plugin);
      if (parentPort) {
        parentPort.postMessage({ status: "done", records });
      }
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
