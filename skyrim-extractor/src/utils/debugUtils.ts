import fs from "fs";
import path from "path";

let debugLogStream: fs.WriteStream | null = null;
let isDebugMode = false;

export function initDebugLog(logPath: string): void {
  // Ensure the directory exists
  const dir = path.dirname(logPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  debugLogStream = fs.createWriteStream(logPath, { flags: "w" });
  isDebugMode = true;
}

export function closeDebugLog(): void {
  if (debugLogStream) {
    debugLogStream.end();
    debugLogStream = null;
  }
  isDebugMode = false;
}

export function debugLog(message: string): void {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;

  if (debugLogStream) {
    debugLogStream.write(logMessage);
  }

  // Only output to console if debug mode is enabled
  if (isDebugMode) {
    // Add extra newlines for certain message types
    if (
      message.startsWith("GRUP at offset") ||
      message.startsWith("Processing nested GRUP") ||
      message.startsWith("Processing at offset")
    ) {
      console.log("\n" + message);
    } else {
      console.log(message);
    }
  }
}

export function hexDump(
  buffer: Buffer,
  start: number,
  length: number = 64
): void {
  const end = Math.min(start + length, buffer.length);
  const slice = buffer.slice(start, end);

  console.log("\n[HEX DUMP] Offset: " + start);
  for (let i = 0; i < slice.length; i += 16) {
    const row = slice.slice(i, i + 16);
    const hex =
      row
        .toString("hex")
        .match(/.{1,2}/g)
        ?.join(" ") ?? "";
    const ascii = row.toString("ascii").replace(/[^\x20-\x7E]/g, ".");
    const offset = (start + i).toString(16).padStart(8, "0");
    console.log(`${offset}  ${hex.padEnd(47)}  ${ascii}`);
  }
  console.log(""); // Add extra newline after hex dump
}

export function logGRUPFields(buffer: Buffer, offset: number): void {
  const size = buffer.readUInt32LE(offset);
  const label = buffer.readUInt32LE(offset + 8);
  const groupType = buffer.readUInt32LE(offset + 12);
  const stamp = buffer.readUInt32LE(offset + 16);
  const unknown = buffer.readUInt32LE(offset + 20);

  const groupTypeStr = Buffer.from([
    (groupType >> 0) & 0xff,
    (groupType >> 8) & 0xff,
    (groupType >> 16) & 0xff,
    (groupType >> 24) & 0xff,
  ])
    .toString("ascii")
    .replace(/\0+$/, "");

  console.log(`[GRUP DEBUG] Parsed GRUP header at offset ${offset}:`);
  console.log(`  Size: ${size}`);
  console.log(`  Label: ${label}`);
  console.log(`  Group Type: ${groupType} (${groupTypeStr})`);
  console.log(`  Stamp: ${stamp}`);
  console.log(`  Unknown: ${unknown}`);
  hexDump(buffer, offset, 64);
}
