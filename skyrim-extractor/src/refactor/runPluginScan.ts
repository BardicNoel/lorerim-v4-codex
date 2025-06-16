import { ThreadPool } from './ThreadPool';
import { PluginMeta } from '../types';
import { BufferMeta } from './types';

export interface ScanOptions {
  maxThreads?: number;
  debug?: boolean;
  onLog?: (message: string) => void;
}

export async function runPluginScan(
  plugins: PluginMeta[],
  options: ScanOptions = {}
): Promise<BufferMeta[]> {
  const {
    maxThreads = Math.max(1, Math.min(4, plugins.length)),
    debug = false,
    onLog = console.log
  } = options;

  const threadPool = new ThreadPool(
    { maxThreads, debug },
    onLog
  );

  return threadPool.processPlugins(plugins);
} 