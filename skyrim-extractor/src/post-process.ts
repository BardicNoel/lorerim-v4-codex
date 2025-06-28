import {
  formatFormId,
  ParsedRecord,
  PluginMeta,
  resolveGlobalFromReference,
} from "@lorerim/platform-types";
import { Worker } from "worker_threads";
import * as path from "path";

// Helper function to group records by a key
function groupBy<T>(
  array: T[],
  keySelector: (item: T) => string
): Record<string, T[]> {
  return array.reduce(
    (groups, item) => {
      const key = keySelector(item);
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(item);
      return groups;
    },
    {} as Record<string, T[]>
  );
}

// // For each record type, look for duplicate formIds, mark the one with the lowest stackOrder as the winner
// for (const recordType in newDict) {
//   const records = newDict[recordType];
//   // group by formId
//   const formIdGroups = groupBy(
//     records,
//     (record: ParsedRecord) => record.meta.formId
//   );

//   // for each formId group, mark the one with the lowest stackOrder as the winner
//   for (const formId in formIdGroups) {
//     const groupRecords = formIdGroups[formId];
//     // Sort by stackOrder (highest is the winner)
//     groupRecords.sort((a: ParsedRecord, b: ParsedRecord) => {
//       const aOrder = a.meta.stackOrder ?? Number.MAX_SAFE_INTEGER;
//       const bOrder = b.meta.stackOrder ?? Number.MAX_SAFE_INTEGER;
//       return bOrder - aOrder;
//     });

//     const shouldLog =
//       recordType === "PERK" &&
//       groupRecords.find(
//         (r) => r.meta.plugin.toLowerCase() === "lorerim - weaponmaster.esp"
//       );
//     if (shouldLog) {
//       console.log("PERK GROUP");
//       console.table(
//         groupRecords.map((r) => ({
//           plugin: r.meta.plugin,
//           formId: r.meta.formId,
//           globalFormId: r.meta.globalFormId,
//         }))
//       );
//     }

//     // GroupRecords is in a stack order, the one at the top is last overwrite and winner
//     // However, the one at the winner declares the globalFormId that should be used for reference everywhere

//     const resolvedGlobalFormID =
//       groupRecords[groupRecords.length - 1].meta.globalFormId;

//     groupRecords[0].meta.isWinner = true;
//     groupRecords[0].meta.globalFormId = resolvedGlobalFormID;

//     if (shouldLog) {
//       console.log("Resolved Global FormId", resolvedGlobalFormID);
//     }

//     for (let i = 1; i < groupRecords.length; i++) {
//       groupRecords[i].meta.isWinner = false;
//       groupRecords[i].meta.globalFormId = resolvedGlobalFormID;
//     }
//   }

const MAX_THREADS = 4;

const resolveConflicts = async (
  parsedRecords: Record<string, ParsedRecord[]>,
  pluginRegistry: Record<string, PluginMeta>
): Promise<Record<string, ParsedRecord[]>> => {
  const recordTypes = Object.keys(parsedRecords);
  const results: Record<string, ParsedRecord[]> = {};
  let current = 0;
  let activeWorkers: Promise<void>[] = [];

  function runWorker(
    recordType: string,
    records: ParsedRecord[]
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const worker = new Worker(
        path.join(__dirname, "resolveConflictsWorker.ts"),
        {
          execArgv: ["-r", "ts-node/register"],
          workerData: {
            recordType,
            records,
            pluginRegistry,
          },
        }
      );
      worker.on(
        "message",
        (msg: { recordType: string; records: ParsedRecord[] }) => {
          results[msg.recordType] = msg.records;
          resolve();
        }
      );
      worker.on("error", reject);
      worker.on("exit", (code) => {
        if (code !== 0)
          reject(new Error(`Worker stopped with exit code ${code}`));
      });
    });
  }

  while (current < recordTypes.length) {
    while (activeWorkers.length < MAX_THREADS && current < recordTypes.length) {
      const recordType = recordTypes[current];
      const records = parsedRecords[recordType];
      activeWorkers.push(runWorker(recordType, records));
      current++;
    }
    // Wait for any worker to finish before launching more
    await Promise.race(activeWorkers);
    // Remove all settled promises (fulfilled or rejected)
    const settled = await Promise.allSettled(activeWorkers);
    const firstSettledIndex = settled.findIndex(
      (s) => s.status === "fulfilled" || s.status === "rejected"
    );
    if (firstSettledIndex !== -1) {
      activeWorkers.splice(firstSettledIndex, 1);
    }
  }
  // Wait for all remaining workers
  await Promise.all(activeWorkers);
  return results;
};

// Extracted per-record-type conflict resolution logic for worker use
function resolveConflictsForType(
  records: ParsedRecord[],
  pluginRegistry: Record<string, PluginMeta>,
  recordType: string
): ParsedRecord[] {
  // Defensive copy
  const newRecords = records.map((record) => ({ ...record }));
  const totalRecords = newRecords.length;
  let lastLoggedPercent = -1;
  for (let i = 0; i < newRecords.length; i++) {
    const record = newRecords[i];
    // Progress indicator: log every 10% or every 1000 records
    const percent = Math.floor((i / totalRecords) * 100);
    if ((percent > lastLoggedPercent && percent % 10 === 0) || i % 1000 === 0) {
      // Only log if in main thread
      if (typeof process !== "undefined" && process.send === undefined) {
        console.log(
          `${recordType} progress: ${percent}% (${i}/${totalRecords})`
        );
      }
      lastLoggedPercent = percent;
    }
    const formIdNumeric = parseInt(record.meta.formId, 16);
    const globalFormId = resolveGlobalFromReference(
      formIdNumeric,
      pluginRegistry[record.meta.plugin],
      pluginRegistry
    );
    if (globalFormId) {
      record.meta.globalFormId = formatFormId(globalFormId);
    }
    // Group by globalFormId
    const globalFormIdGroups = groupBy(
      newRecords,
      (record: ParsedRecord) => record.meta.globalFormId
    );
    for (const globalFormId in globalFormIdGroups) {
      const groupRecords = globalFormIdGroups[globalFormId];
      // Sort by stackOrder (highest is the winner)
      groupRecords.sort((a: ParsedRecord, b: ParsedRecord) => {
        const aOrder = a.meta.stackOrder ?? Number.MAX_SAFE_INTEGER;
        const bOrder = b.meta.stackOrder ?? Number.MAX_SAFE_INTEGER;
        return bOrder - aOrder;
      });
      // Set the isWinner flag to the one with the lowest stackOrder
      groupRecords[0].meta.isWinner = true;
      for (let i = 1; i < groupRecords.length; i++) {
        groupRecords[i].meta.isWinner = false;
      }
    }
  }
  return newRecords;
}

export { resolveConflicts as flagWinners, resolveConflictsForType };
