import * as fs from "fs";

let missingFormIds = new Set<string>();

export function loadMissingFormIds(filePath: string) {
  const lines = fs.readFileSync(filePath, "utf-8").split("\n");
  missingFormIds = new Set(
    lines.map((line) => line.trim().toLowerCase()).filter(Boolean)
  );
}

export function isMissingFormId(formId: number): boolean {
  const formatted = "0x" + formId.toString(16).padStart(8, "0").toLowerCase();
  return missingFormIds.has(formatted);
}
