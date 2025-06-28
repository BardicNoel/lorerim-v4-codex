import { parentPort, workerData } from "worker_threads";
import { ParsedRecord, PluginMeta } from "@lorerim/platform-types";
import { resolveConflictsForType } from "./post-process";

if (!parentPort) throw new Error("Must be run as a worker");

const { recordType, records, pluginRegistry } = workerData as {
  recordType: string;
  records: ParsedRecord[];
  pluginRegistry: Record<string, PluginMeta>;
};

const result = resolveConflictsForType(records, pluginRegistry, recordType);
parentPort.postMessage({ recordType, records: result });
