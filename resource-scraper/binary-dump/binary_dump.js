    export function hexDump(buffer, start, length, context = 16) {
    const lines = [];
    const end = Math.min(start + length, buffer.length);
    const contextStart = Math.max(0, start - context);
    const contextEnd = Math.min(buffer.length, end + context);
  
    // Add header
    lines.push("Hex dump with context:");
    lines.push("Offset   00 01 02 03 04 05 06 07 08 09 0A 0B 0C 0D 0E 0F  ASCII");
    lines.push(
      "-------- ------------------------------------------------  ----------------"
    );
  
    // Process each line (16 bytes per line)
    for (let i = contextStart; i < contextEnd; i += 16) {
      const lineEnd = Math.min(i + 16, contextEnd);
      const bytes = buffer.slice(i, lineEnd);
  
      // Format offset
      const offset = i.toString(16).padStart(8, "0");
  
      // Format hex values
      const hexValues = Array.from(bytes)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join(" ");
      const hexPadding = "   ".repeat(16 - bytes.length);
  
      // Format ASCII
      const ascii = bytes.toString("ascii").replace(/[^\x20-\x7E]/g, ".");
      const asciiPadding = " ".repeat(16 - ascii.length);
  
      // Add markers for the error region
      const isErrorRegion = i >= start && i < end;
      const marker = isErrorRegion ? ">>> " : "    ";
  
      lines.push(
        `${marker}${offset}  ${hexValues}${hexPadding}  ${ascii}${asciiPadding}`
      );
    }
  
    return lines;
  }
  