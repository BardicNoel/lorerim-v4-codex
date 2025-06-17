import { hexDump } from '../utils/debugUtils';
import { BufferMeta } from './types';
import { formatFormId, ParsedRecord } from '@lorerim/platform-types';

export function extractParsedRecords(
  buffer: Buffer,
  metas: BufferMeta[],
  stackOrder: number
): ParsedRecord[] {
  const records: ParsedRecord[] = [];

  for (const meta of metas) {
    if (meta.tag === 'GRUP' || meta.tag === 'TES4') continue;
    const recordBuffer = buffer.subarray(meta.offset, meta.offset + meta.size);

    const header = recordBuffer.subarray(0, 24).toString('base64');
    const dataBuffer = recordBuffer.subarray(24);



    let offset = 0;
    const data: Record<string, string[]> = {};

    while (offset + 6 <= dataBuffer.length) {
      const tag = dataBuffer.toString('ascii', offset, offset + 4);
      const size = dataBuffer.readUInt16LE(offset + 4);
    
      if (!/^[A-Z0-9]{4}$/.test(tag)) {
        console.warn(`Invalid tag '${tag}' at offset ${offset}`);
        break;
      }
    
      const payload = dataBuffer.subarray(offset + 6, offset + 6 + size);
      if (!data[tag]) data[tag] = [];
      data[tag].push(payload.toString('base64'));
    
      offset += 6 + size;
      
    }

    records.push({
      meta: {
        type: meta.tag,
        formId: formatFormId(meta.formId!),
        plugin: meta.sourcePlugin,
        stackOrder
      },
      data,
      header
    });
  }

  return records;
}
