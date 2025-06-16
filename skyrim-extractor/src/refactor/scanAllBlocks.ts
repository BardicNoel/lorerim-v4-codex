import { BufferMeta } from './types';

interface ScanContext {
  sourcePlugin: string;
  modFolder: string;
  pluginIndex: number;
  recordTypeFilter?: string[];
  onLog?: (level: 'info' | 'debug', message: string) => void;
}

export async function scanAllBlocks(
  buffer: Buffer,
  context: ScanContext,
  parentPath: string[] = []
): Promise<BufferMeta[]> {
  const results: BufferMeta[] = [];
  let offset = 0;
  let skippedRecords = 0;
  let processedRecords = 0;

  while (offset < buffer.length) {
    const tag = buffer.toString('ascii', offset, offset + 4);
    const size = buffer.readUInt32LE(offset + 4);
    const endOffset = offset + size;

    if (tag === 'GRUP') {
      const groupType = buffer.readUInt32LE(offset + 8);
      const label = buffer.readUInt32LE(offset + 12);
      
      context.onLog?.('debug', `Processing GRUP ${groupType} at offset ${offset}`);
      
      // Create GRUP metadata
      results.push({
        tag: 'GRUP',
        offset,
        endOffset,
        size,
        groupType,
        label,
        parentPath: [...parentPath],
        sourcePlugin: context.sourcePlugin,
        modFolder: context.modFolder,
        pluginIndex: context.pluginIndex
      });

      // Recursively scan the GRUP contents
      const groupPath = [...parentPath, `GRUP:${groupType}:${label.toString(16).toUpperCase()}`];
      const groupResults = await scanAllBlocks(
        buffer.slice(offset + 24, endOffset),
        context,
        groupPath
      );
      results.push(...groupResults);
      offset = endOffset;
    } else {
      const dataSize = size;
      const totalSize = 24 + dataSize;
      
      // Skip if record type is not in filter
      if (context.recordTypeFilter && !context.recordTypeFilter.includes(tag)) {
        skippedRecords++;
        if (skippedRecords % 1000 === 0) {
          context.onLog?.('debug', `Skipped ${skippedRecords} records, processed ${processedRecords} records`);
        }
        offset += totalSize;
        continue;
      }

      const formId = buffer.readUInt32LE(offset + 8);
      processedRecords++;
      
      if (processedRecords % 1000 === 0) {
        context.onLog?.('debug', `Processed ${processedRecords} records, skipped ${skippedRecords} records`);
      }
    
      results.push({
        tag,
        offset,
        endOffset: offset + totalSize,
        size: totalSize,
        formId,
        parentPath: [...parentPath],
        sourcePlugin: context.sourcePlugin,
        modFolder: context.modFolder,
        pluginIndex: context.pluginIndex
      });
    
      offset += totalSize;
      continue;
    }
  }

  context.onLog?.('info', `Finished scanning: processed ${processedRecords} records, skipped ${skippedRecords} records`);
  return results;
} 