import { BufferMeta } from './types';

interface ScanContext {
  sourcePlugin: string;
  modFolder: string;
  pluginIndex: number;
}

export async function scanAllBlocks(
  buffer: Buffer,
  context: ScanContext,
  parentPath: string[] = []
): Promise<BufferMeta[]> {
  const results: BufferMeta[] = [];
  let offset = 0;

  while (offset < buffer.length) {
    const tag = buffer.toString('ascii', offset, offset + 4);
    const size = buffer.readUInt32LE(offset + 4);
    const endOffset = offset + size;

    if (tag === 'GRUP') {
      const groupType = buffer.readUInt32LE(offset + 8);
      const label = buffer.readUInt32LE(offset + 12);
      
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
    } else {
      // Regular record
      const formId = buffer.readUInt32LE(offset + 8);
      results.push({
        tag,
        offset,
        endOffset,
        size,
        formId,
        parentPath: [...parentPath],
        sourcePlugin: context.sourcePlugin,
        modFolder: context.modFolder,
        pluginIndex: context.pluginIndex
      });
    }

    offset = endOffset;
  }

  return results;
} 