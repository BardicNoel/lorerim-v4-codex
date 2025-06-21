import { ThreadPool } from "./ThreadPool";
import { ParsedRecord, PluginMeta } from "@lorerim/platform-types";
import { ProcessingStats } from "../utils/statsCollector";
import { BufferMeta } from "./types";

export interface ScanOptions {
  maxThreads?: number;
  debug?: boolean;
  onLog?: (message: string) => void;
  recordTypeFilter?: string[];
}

export async function runPluginScan(
  plugins: PluginMeta[],
  options: ScanOptions = {}
): Promise<{
  bufferMetas: BufferMeta[];
  parsedRecords: ParsedRecord[];
  stats: ProcessingStats;
}> {
  const {
    maxThreads = Math.max(1, Math.min(4, plugins.length)),
    debug = false,
    onLog = console.log,
    recordTypeFilter,
  } = options;

  const threadPool = new ThreadPool(
    { maxThreads, debug, recordTypeFilter },
    onLog
  );

  return threadPool.processPlugins(plugins);
}
