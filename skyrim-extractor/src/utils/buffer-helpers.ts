/**
 * Reads a null-terminated string from a buffer
 * @param buffer The buffer to read from
 * @param offset Starting offset in the buffer
 * @param size Maximum size to read
 * @returns The decoded string
 */
export function readString(buffer: Buffer, offset: number, size: number): string {
  // Find null terminator within size limit
  let end = offset;
  while (end < offset + size && buffer[end] !== 0) {
    end++;
  }
  
  // Convert to string, handling potential encoding issues
  return buffer.toString('utf8', offset, end);
} 