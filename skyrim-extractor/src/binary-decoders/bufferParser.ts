import { RecordHeader, Subrecord } from "../types";
import { parentPort } from "worker_threads";
import { RECORD_HEADER, SUBRECORD_HEADER, BUFFER } from "./buffer.constants";

// Types we care about according to design doc
const PROCESSED_RECORD_TYPES = new Set([
  "PERK", // Perks
  "AVIF", // Actor Value Information
  "RACE", // Races
  "SPEL", // Spells
  "MGEF", // Magic Effects
]);

type DebugCallback = (message: string) => void;

let debugCallback: DebugCallback | null = null;

export function setDebugCallback(callback: DebugCallback) {
  debugCallback = callback;
}

export function debugLog(message: string) {
  if (debugCallback) {
    debugCallback(message);
  } else if (parentPort) {
    // Fallback to direct parentPort if callback not set
    parentPort.postMessage({ type: "debug", message });
  }
}

export function hexDump(
  buffer: Buffer,
  start: number,
  length: number,
  context: number = 16
): string[] {
  const lines: string[] = [];
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

export function getRecordTypeAt(buffer: Buffer, offset: number): string {
  if (offset + 4 > buffer.length) {
    return "UNKNOWN";
  }
  const type = buffer.toString("ascii", offset, offset + 4);
  return /^[A-Z]{4}$/.test(type) ? type : "UNKNOWN";
}

// export function* scanSubrecords(buffer: Buffer): Generator<Subrecord> {
//   let offset = 0;
//   let useExtendedSize = false;
//   let extendedSize = 0;

//   while (offset + SUBRECORD_HEADER.TOTAL_SIZE <= buffer.length) {
//     // Read the subrecord type (4 bytes)
//     const type = buffer.toString('ascii', offset, offset + SUBRECORD_HEADER.SIGNATURE_SIZE);

//     // Skip invalid subrecord types
//     if (!/^[A-Z]{4}$/.test(type)) {
//       const dump = hexDump(buffer, offset, BUFFER.RECORD_TYPE_SIZE).join('\n');
//       throw new Error(`Invalid subrecord type '${type}' at offset ${offset}\n${dump}`);
//     }

//     // Handle XXXX extended size marker
//     if (type === 'XXXX') {
//       if (offset + 8 > buffer.length) {
//         const dump = hexDump(buffer, offset, buffer.length - offset).join('\n');
//         throw new Error(`Incomplete XXXX subrecord at offset ${offset}\n${dump}`);
//       }
//       extendedSize = buffer.readUInt32LE(offset + SUBRECORD_HEADER.SIGNATURE_SIZE);
//       useExtendedSize = true;
//       offset += 8;
//       continue;
//     }

//     // Read the subrecord size (2 bytes)
//     if (offset + SUBRECORD_HEADER.TOTAL_SIZE > buffer.length) {
//       const dump = hexDump(buffer, offset, buffer.length - offset).join('\n');
//       throw new Error(`Incomplete subrecord size at offset ${offset}\n${dump}`);
//     }
//     const size = useExtendedSize ? extendedSize : buffer.readUInt16LE(offset + SUBRECORD_HEADER.SIGNATURE_SIZE);

//     // Calculate data boundaries
//     const dataStart = offset + SUBRECORD_HEADER.TOTAL_SIZE;
//     const dataEnd = dataStart + size;

//     // Validate data boundaries
//     if (dataEnd > buffer.length) {
//       const dump = hexDump(buffer, offset, BUFFER.INITIAL_DATA_DUMP, BUFFER.INITIAL_DATA_DUMP).join('\n');
//       throw new Error(
//         `Subrecord '${type}' at offset ${offset} exceeds buffer length (size: ${size}, buffer: ${buffer.length})\n` +
//         `Buffer context:\n${dump}`
//       );
//     }

//     // Extract and yield the subrecord data
//     const data = buffer.subarray(dataStart, dataEnd);
//     yield { type, size, data };

//     // Move to next subrecord
//     offset = dataEnd;
//     useExtendedSize = false;
//   }
// }
