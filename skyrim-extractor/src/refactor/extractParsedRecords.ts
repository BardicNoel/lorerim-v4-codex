import { BufferMeta } from "./types";
import {
  formatFormId,
  ParsedRecord,
  decompressRecordData,
  isRecordCompressed,
  resolveGlobalFromLocal,
  PluginMeta,
} from "@lorerim/platform-types";

export function extractParsedRecords(
  buffer: Buffer,
  metas: BufferMeta[],
  plugin: PluginMeta
): ParsedRecord[] {
  const records: ParsedRecord[] = [];

  for (const meta of metas) {
    if (meta.tag === "GRUP" || meta.tag === "TES4") continue;
    const recordBuffer = buffer.subarray(meta.offset, meta.offset + meta.size);

    const header = recordBuffer.subarray(0, 24).toString("base64");
    const dataBuffer = recordBuffer.subarray(24);

    // Check if the record is compressed
    const isCompressed = isRecordCompressed(recordBuffer);

    let processedDataBuffer: Buffer;
    if (isCompressed && meta.tag === "PERK") {
      // Decompress the data
      const decompressionResult = decompressRecordData(
        recordBuffer,
        dataBuffer.length,
        true
      );
      if (!decompressionResult.success) {
        console.warn(
          `[${meta.sourcePlugin}::${meta.tag}] Failed to decompress record: ${decompressionResult.error}`
        );
        continue; // Skip this record if decompression fails
      }
      processedDataBuffer = decompressionResult.data!;
    } else {
      processedDataBuffer = dataBuffer;
    }

    let offset = 0;
    const record: { tag: string; buffer: string }[] = [];

    while (offset + 6 <= processedDataBuffer.length) {
      const tag = processedDataBuffer.toString("ascii", offset, offset + 4);
      const size = processedDataBuffer.readUInt16LE(offset + 4);

      const payload = processedDataBuffer.subarray(
        offset + 6,
        offset + 6 + size
      );
      record.push({ tag, buffer: payload.toString("base64") });

      offset += 6 + size;
    }

    // const globalFormId = resolveGlobalFromLocal(
    //   meta.formId!,
    //   plugin.inTypeOrder,
    //   plugin.isEsl
    // );

    // if (plugin.name.toLowerCase() === "lorerim - weaponmaster.esp") {
    //   console.log(meta.formId, plugin, globalFormId);
    // }

    const newRecord: ParsedRecord = {
      meta: {
        type: meta.tag,
        formId: formatFormId(meta.formId!),
        globalFormId: formatFormId(0), // GLOBAL should be set by post-processing, it needs to consider masters
        plugin: meta.sourcePlugin,
        stackOrder: plugin.loadOrder,
      },
      record,
      header,
    };

    // if (plugin.name.toLowerCase() === "lorerim - weaponmaster.esp") {
    //   console.log(formatFormId(globalFormId));
    //   console.log(newRecord.meta);
    // }

    records.push(newRecord);
  }

  return records;
}
