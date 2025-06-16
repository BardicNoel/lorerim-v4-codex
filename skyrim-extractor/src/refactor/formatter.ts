/**
 * Utility functions for formatting Skyrim plugin data
 */

/**
 * Formats a GRUP label value (UInt32LE) into an ASCII string
 * @param labelValue The 32-bit integer label value from the GRUP
 * @returns The formatted ASCII string (e.g., 'PERK' for 0x4B455250)
 */
export function formatGrupLabel(labelValue: number): string {
  return Buffer.from([
    labelValue & 0xFF,
    (labelValue >> 8) & 0xFF,
    (labelValue >> 16) & 0xFF,
    (labelValue >> 24) & 0xFF
  ]).toString('ascii');
}

/**
 * Formats a GRUP label value into a hex string
 * @param labelValue The 32-bit integer label value from the GRUP
 * @returns The formatted hex string (e.g., '4B455250' for 'PERK')
 */
export function formatGrupLabelHex(labelValue: number): string {
  return labelValue.toString(16).toUpperCase().padStart(8, '0');
}

/**
 * Formats a GRUP label value into a display string
 * @param labelValue The 32-bit integer label value from the GRUP
 * @returns A formatted string combining ASCII and hex (e.g., 'PERK (0x4B455250)')
 */
export function formatGrupLabelDisplay(labelValue: number): string {
  const ascii = formatGrupLabel(labelValue);
  const hex = formatGrupLabelHex(labelValue);
  return `${ascii} (0x${hex})`;
}

/**
 * Creates a detailed hex dump of a buffer slice
 * @param buffer The buffer to dump
 * @param start Start offset in the buffer
 * @param length Number of bytes to dump
 * @returns Formatted hex dump string
 */
export function grupHeaderDump(buffer: Buffer, start: number, length: number): string {
  const bytes = buffer.slice(start, start + length);
  const hex = bytes.toString('hex').toUpperCase();
  const ascii = bytes.toString('ascii').replace(/[^\x20-\x7E]/g, '.');
  
  let result = '';
  // Header
  result += 'Offset  Tag    Size    Type    Label    ASCII\n';
  result += '----------------------------------------\n';
  
  // Data
  const tag = bytes.slice(0, 4).toString('ascii');
  const size = bytes.readUInt32LE(4);
  const type = bytes.readUInt32LE(8);
  const label = bytes.readUInt32LE(12);
  const labelAscii = Buffer.from([
    label & 0xFF,
    (label >> 8) & 0xFF,
    (label >> 16) & 0xFF,
    (label >> 24) & 0xFF
  ]).toString('ascii').replace(/[^\x20-\x7E]/g, '.');

  result += `${start.toString(16).padStart(6, '0')}  `;
  result += `${tag}  `;
  result += `${size.toString(16).padStart(8, '0')}  `;
  result += `${type.toString(16).padStart(8, '0')}  `;
  result += `${label.toString(16).padStart(8, '0')}  `;
  result += `${labelAscii}\n`;

  // Raw hex dump
  result += '\nRaw bytes:\n';
  for (let i = 0; i < hex.length; i += 32) {
    const hexLine = hex.slice(i, i + 32).match(/.{1,2}/g)?.join(' ') || '';
    const asciiLine = ascii.slice(i/2, i/2 + 16);
    result += `${hexLine.padEnd(48)} | ${asciiLine}\n`;
  }
  return result;
}

/**
 * Creates a detailed byte-by-byte hex dump of a buffer slice
 * @param buffer The buffer to dump
 * @param start Start offset in the buffer
 * @param length Number of bytes to dump
 * @returns Formatted hex dump string
 */
export function byteDump(buffer: Buffer, start: number, length: number): string {
  const bytes = buffer.slice(start, start + length);
  let result = '';
  
  // Header
  result += 'Offset  Bytes (hex)                ASCII\n';
  result += '----------------------------------------\n';
  
  // Process 16 bytes at a time
  for (let i = 0; i < length; i += 16) {
    const lineBytes = bytes.slice(i, Math.min(i + 16, length));
    const offset = start + i;
    
    // Format hex bytes
    const hexBytes = Array.from(lineBytes)
      .map(b => b.toString(16).toUpperCase().padStart(2, '0'))
      .join(' ');
    
    // Format ASCII
    const ascii = lineBytes.toString('ascii').replace(/[^\x20-\x7E]/g, '.');
    
    // Add line
    result += `${offset.toString(16).padStart(6, '0')}  `;
    result += `${hexBytes.padEnd(48)} | ${ascii}\n`;
  }
  
  return result;
}
