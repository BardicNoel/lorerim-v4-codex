import { BufferMeta } from './types';
import { formatGrupLabelDisplay, byteDump } from './formatter';

interface ScanContext {
  sourcePlugin: string;
  modFolder: string;
  pluginIndex: number;
  recordTypeFilter?: string[];
  onLog?: (level: 'info' | 'debug', message: string) => void;
}

enum GrupOffset {
  Label = 8,
  GroupType = 12,
  DataSize = 16,
  TotalSize = 20,
  EndOffset = 24,
  FormId = 8,
  DataOffset = 24,
}

enum RecordOffset {
  FormId = 8,
  DataOffset = 24,
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
      const label = buffer.readUInt32LE(offset + GrupOffset.Label);
      const groupType = buffer.readUInt32LE(offset + GrupOffset.GroupType);
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
        buffer.slice(offset + GrupOffset.EndOffset, endOffset),
        context,
        groupPath
      );
      results.push(...groupResults);
      offset = endOffset;
    } else {
      const dataSize = size;
      const totalSize = RecordOffset.DataOffset + dataSize;
      
      // Skip if record type is not in filter
      if (context.recordTypeFilter && !context.recordTypeFilter.includes(tag)) {
        skippedRecords++;
        // if (skippedRecords % 1000 === 0) {
        //   context.onLog?.('debug', `Skipped ${skippedRecords} records, processed ${processedRecords} records`);
        // }
        offset += totalSize;
        continue;
      }

      const formId = buffer.readUInt32LE(offset + RecordOffset.FormId);
      processedRecords++;
      
      // if (processedRecords % 1000 === 0) {
      //   context.onLog?.('debug', `Processed ${processedRecords} records, skipped ${skippedRecords} records`);
      // }
    
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

  // context.onLog?.('info', `Finished scanning: processed ${processedRecords} records, skipped ${skippedRecords} records`);
  return results;
} 