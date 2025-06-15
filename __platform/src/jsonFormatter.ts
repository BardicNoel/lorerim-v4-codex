/**
 * Custom JSON formatter that makes data fields with Buffer values compact while keeping other objects readable
 */
export function formatJSON(obj: any, indent = 0): string {
  const space = "  ".repeat(indent);

  // Special handling for Buffer objects
  if (
    obj &&
    typeof obj === "object" &&
    obj.type === "Buffer" &&
    Array.isArray(obj.data)
  ) {
    return `{"type":"Buffer","data":[${obj.data.join(",")}]}`;
  }

  if (Array.isArray(obj)) {
    if (obj.length === 0) return "[]";
    return `[\n${obj
      .map((item) => space + "  " + formatJSON(item, indent + 1))
      .join(",\n")}\n${space}]`;
  }

  if (obj && typeof obj === "object") {
    const entries = Object.entries(obj);
    if (entries.length === 0) return "{}";
    return `{\n${entries
      .map(
        ([key, value]) => `${space}  "${key}": ${formatJSON(value, indent + 1)}`
      )
      .join(",\n")}\n${space}}`;
  }

  return JSON.stringify(obj);
}
