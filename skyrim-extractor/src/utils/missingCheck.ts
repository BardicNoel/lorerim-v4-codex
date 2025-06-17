import * as fs from "fs";
import * as path from "path";

let missingFormIds = new Set<string>();

export function loadMissingFormIds(filePath: string) {
  const lines = fs
    .readFileSync(path.join(__dirname, filePath), "utf-8")
    .split("\n");
  missingFormIds = new Set(
    lines
      .map((line) => line.trim().toLowerCase())
      .filter(Boolean)
      .map((hex) => "0x" + hex.padStart(8, "0").toLowerCase())
  );
  console.log(missingFormIds);
}

export function isMissingFormId(formId: number): boolean {
  const formatted = formId.toString(16).padStart(8, "0").toLowerCase();
  //   console.log(formatted);
  return missingFormIds.has(formatted);
}

export function isMissingFormIdString(formId: string): boolean {
  return missingFormIds.has(formId);
}
