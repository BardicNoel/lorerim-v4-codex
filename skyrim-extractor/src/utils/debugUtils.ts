import fs from 'fs';
import path from 'path';

let debugLogStream: fs.WriteStream | null = null;

export function initDebugLog(outputDir: string): void {
  const debugLogPath = path.join(outputDir, 'debug.log');
  debugLogStream = fs.createWriteStream(debugLogPath, { flags: 'a' });
}

export function closeDebugLog(): void {
  if (debugLogStream) {
    debugLogStream.end();
    debugLogStream = null;
  }
}

export function debugLog(message: string): void {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  
  if (debugLogStream) {
    debugLogStream.write(logMessage);
  }
  console.log(message);
}

export function hexDump(buffer: Buffer, start: number, length: number = 64): void {
  const end = Math.min(start + length, buffer.length);
  const slice = buffer.slice(start, end);

  console.log(`[HEX DUMP] Offset: ${start}`);
  for (let i = 0; i < slice.length; i += 16) {
    const row = slice.slice(i, i + 16);
    const hex = row.toString('hex').match(/.{1,2}/g)?.join(' ') ?? '';
    const ascii = row.toString('ascii').replace(/[^\x20-\x7E]/g, '.');
    const offset = (start + i).toString(16).padStart(8, '0');
    console.log(`${offset}  ${hex.padEnd(47)}  ${ascii}`);
  }
}

export function logGRUPFields(buffer: Buffer, offset: number): void {
  const size = buffer.readUInt32LE(offset);
  const label = buffer.readUInt32LE(offset + 8);
  const groupType = buffer.readUInt32LE(offset + 12);
  const stamp = buffer.readUInt32LE(offset + 16);
  const unknown = buffer.readUInt32LE(offset + 20);

  const groupTypeStr = Buffer.from([
    (groupType >> 0) & 0xFF,
    (groupType >> 8) & 0xFF,
    (groupType >> 16) & 0xFF,
    (groupType >> 24) & 0xFF
  ]).toString('ascii').replace(/\0+$/, '');

  console.log(`[GRUP DEBUG] Parsed GRUP header at offset ${offset}:`);
  console.log(`  Size: ${size}`);
  console.log(`  Label: ${label}`);
  console.log(`  Group Type: ${groupType} (${groupTypeStr})`);
  console.log(`  Stamp: ${stamp}`);
  console.log(`  Unknown: ${unknown}`);
  hexDump(buffer, offset, 64);
} 