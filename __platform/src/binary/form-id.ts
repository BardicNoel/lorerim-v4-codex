import { formatFormId } from "../formatter";
import { PluginMeta } from "../types";

function resolveGlobalFromLocal(
  localFormId: number,
  pluginLoadOrder: number,
  isEsl: boolean = false
): number {
  if (isEsl) {
    // ESL plugin: encode as 0xFEYYXXXX
    const eslSlot = pluginLoadOrder & 0xfff; // limit to 1 byte
    const formIndex = localFormId & 0xfff;
    return ((0xfe << 24) | (eslSlot << 12) | formIndex) >>> 0;
  }

  // Normal ESM/ESP plugin
  // Use unsigned right shift to ensure we get an unsigned 32-bit result
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
  if (!contextPlugin.masters) {
    console.warn("Cannot resolve without masters");
    return null;
  }
  // Extract High Byte from formId
  const highByte = (rawFormID >>> 24) & 0xff;

  // de-case registry
  const registry = Object.fromEntries(
    Object.entries(pluginRegistry).map(([key, value]) => [
      key.toLowerCase(),
      value,
    ])
  );

  const localFormId = rawFormID & 0x00ffffff;

  const pluginMastersIndex = highByte;

  const pluginName =
    pluginMastersIndex < contextPlugin.masters.length
      ? contextPlugin.masters[pluginMastersIndex]
      : contextPlugin.name; // If the index is out of bounds, it means the record is in the same plugin

  const resolvedPlugin = registry[pluginName.toLowerCase()];

  if (!resolvedPlugin) {
    console.warn(
      `[WARN] Could not find plugin "${pluginName}" in registry while resolving for ${contextPlugin.name}`
    );
    return null;
  }

  if (resolvedPlugin.isEsl) {
    // Format to ESL, which is 0xFEYYYXXX where YYY is the plugin inTypeLoadOrder and XXX is the formId
    const eslFormId =
      ((0xfe << 24) | (resolvedPlugin.inTypeOrder << 12) | localFormId) >>> 0;
    if (resolvedPlugin.name.toLowerCase() === "lorerim - weaponmaster.esp") {
      console.log("ESL FormID", formatFormId(eslFormId), resolvedPlugin.name);
    }
    return eslFormId;
  }

  return ((resolvedPlugin.inTypeOrder << 24) | localFormId) >>> 0;
}

export { resolveGlobalFromLocal, resolveGlobalFromReference };
