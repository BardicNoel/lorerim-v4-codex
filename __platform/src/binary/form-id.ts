import { PluginMeta } from "../types";

function resolveGlobalFromLocal(
  localFormId: number,
  pluginLoadOrder: number,
  isEsl: boolean = false
): number {
  if (isEsl) {
    console.log("isEsl");
    // ESL plugin: encode as 0xFEYYXXXX
    const eslSlot = pluginLoadOrder & 0xff; // limit to 1 byte
    return ((0xfe << 24) | (eslSlot << 16) | (localFormId & 0xffff)) >>> 0;
  }

  // Normal ESM/ESP plugin
  return ((pluginLoadOrder << 24) | (localFormId & 0x00ffffff)) >>> 0;
}

/**
 * Resolves a raw FormID from a referencing plugin context into a globally resolved FormID.
 *
 * @param rawFormID - The 32-bit FormID (e.g. from PNAM) to resolve.
 * @param contextPlugin - The PluginMeta of the plugin where the FormID was read.
 * @param pluginRegistry - Map of all PluginMetas by plugin name.
 * @returns resolved global FormID, or null if resolution fails.
 */
function resolveGlobalFromReference(
  rawFormID: number,
  contextPlugin: PluginMeta,
  pluginRegistry: Record<string, PluginMeta>
): number | null {
  const fileIndex = (rawFormID >>> 24) & 0xff;
  const localID = rawFormID & 0x00ffffff;

  // Calculate the number of masters for this plugin
  const masterCount = contextPlugin.masters?.length || 0;

  console.log(fileIndex, masterCount);

  // Case 1: Index equals master count + 1 = record in the referencing plugin itself
  if (fileIndex === masterCount) {
    return (contextPlugin.loadOrder << 24) | localID;
  }

  // Case 2: Reference to a master (index 0 to masterCount)
  if (fileIndex < masterCount) {
    const masterName = contextPlugin.masterIndexMap?.[fileIndex];
    if (!masterName) {
      console.warn(
        `[WARN] Could not resolve file index ${fileIndex} in ${contextPlugin.name}. Available indices: ${Object.keys(contextPlugin.masterIndexMap || {}).join(", ")}`
      );
      return null;
    }

    const masterPlugin = pluginRegistry[masterName];
    if (!masterPlugin) {
      console.warn(
        `[WARN] Could not find plugin "${masterName}" in registry while resolving for ${contextPlugin.name}`
      );
      return null;
    }

    return (masterPlugin.loadOrder << 24) | localID;
  }

  // Case 3: Invalid index (beyond master count + 1)
  console.warn(
    `[WARN] Invalid file index ${fileIndex} in ${contextPlugin.name}. Expected 0-${masterCount} for masters or ${masterCount + 1} for local records.`
  );
  return null;
}

export { resolveGlobalFromLocal, resolveGlobalFromReference };
