export interface SubrecordTagFormat {
  tag: string;
  buffer: string;
}

/**
 * Splits a Skyrim record buffer into its subrecords (tag, buffer pairs).
 * @param processedDataBuffer The buffer containing the subrecords.
 * @returns Array of subrecords with tag and buffer.
 */
export function extractSubrecords(
  processedDataBuffer: Buffer
): SubrecordTagFormat[] {
  let offset = 0;
  const subrecords: SubrecordTagFormat[] = [];

  while (offset + 6 <= processedDataBuffer.length) {
    const tag = processedDataBuffer.toString("ascii", offset, offset + 4);
    const size = processedDataBuffer.readUInt16LE(offset + 4);
    const payload = processedDataBuffer.subarray(offset + 6, offset + 6 + size);
    subrecords.push({ tag, buffer: payload.toString("base64") });
    offset += 6 + size;
  }

  return subrecords;
}
