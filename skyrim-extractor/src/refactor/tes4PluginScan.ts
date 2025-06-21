import * as fs from "fs";
import {
  autoDecompressRecordData,
  isRecordCompressed,
  PluginMeta,
  RecordOffset,
} from "@lorerim/platform-types";

interface TES4Record {
  masters: string[];
  masterIndexMap: Record<number, string>;
  fileIndexMap: Record<string, number>;
  fileToLoadOrderMap: Record<number, number>;
}

/**
 * Read and parse TES4 record from a plugin file
 */
export async function scanTES4Record(
  pluginPath: string
): Promise<TES4Record | null> {
  try {
    const buffer = await fs.promises.readFile(pluginPath);

    // Check if file is large enough to contain a TES4 record
    if (buffer.length < RecordOffset.DataOffset) {
      return null;
    }

    // Look for TES4 record at the beginning
    const tag = buffer.toString("ascii", 0, 4);
    if (tag !== "TES4") {
      return null;
    }

    const dataSize = buffer.readUInt32LE(RecordOffset.Size);
    const flags = buffer.readUInt32LE(8);
    const formId = buffer.readUInt32LE(RecordOffset.FormId);
    const version = buffer.readUInt8(16);
    const unknown = buffer.readUInt8(17);

    // Check if TES4 record is compressed
    const isCompressed = isRecordCompressed(buffer);
    if (isCompressed) {
      console.log(`[DEBUG] TES4 record is compressed in ${pluginPath}`);
    }

    // Decompress if necessary
    let recordData: Buffer;
    if (isCompressed) {
      const decompressionResult = autoDecompressRecordData(buffer, dataSize);
      if (decompressionResult.success && decompressionResult.data) {
        recordData = decompressionResult.data;
        console.log(
          `[DEBUG] Successfully decompressed TES4 data: ${decompressionResult.originalSize} -> ${decompressionResult.decompressedSize} bytes`
        );
      } else {
        console.warn(
          `[WARN] Failed to decompress TES4 record in ${pluginPath}: ${decompressionResult.error}`
        );
        // Fall back to original data
        recordData = buffer.slice(
          RecordOffset.DataOffset,
          RecordOffset.DataOffset + dataSize
        );
      }
    } else {
      // Use original data for uncompressed records
      recordData = buffer.slice(
        RecordOffset.DataOffset,
        RecordOffset.DataOffset + dataSize
      );
    }

    // Parse subrecords to find MAST entries
    const masters: string[] = [];
    let offset = 0; // Start at beginning of record data

    while (offset < recordData.length && offset + 6 <= recordData.length) {
      const subrecordTag = recordData.toString("ascii", offset, offset + 4);
      const subrecordSize = recordData.readUInt16LE(offset + 4);

      if (subrecordTag === "MAST") {
        // MAST record contains master file name
        const masterName = recordData
          .toString("ascii", offset + 6, offset + 6 + subrecordSize)
          .replace(/\0/g, "");
        masters.push(masterName);
        // console.log(`[DEBUG] Found master: ${masterName}`);
      }

      offset += 6 + subrecordSize; // Move to next subrecord
    }

    // Create index mappings
    const masterIndexMap: Record<number, string> = {};
    const fileIndexMap: Record<string, number> = {};

    masters.forEach((master, index) => {
      masterIndexMap[index] = master;
      fileIndexMap[master] = index;
    });

    // fileToLoadOrderMap will be built during hydration when we have access to the plugin registry
    const fileToLoadOrderMap: Record<number, number> = {};

    // if (masters.length > 0) {
    //   console.log(
    //     `[DEBUG] TES4 scan complete - ${masters.length} masters found`
    //   );
    // }

    return {
      masters,
      masterIndexMap,
      fileIndexMap,
      fileToLoadOrderMap,
    };
  } catch (error) {
    console.error(
      `[ERROR] Failed to scan TES4 record in ${pluginPath}:`,
      error
    );
    return null;
  }
}

/**
 * Hydrate PluginMeta objects with master information from TES4 records
 */
export async function hydratePluginMetas(
  plugins: PluginMeta[]
): Promise<PluginMeta[]> {
  // console.log(
  //   `[INFO] Hydrating ${plugins.length} plugins with TES4 master information...`
  // );

  // Create a plugin registry for lookup
  const pluginRegistry: Record<string, PluginMeta> = {};
  plugins.forEach((plugin) => {
    pluginRegistry[plugin.name.toLocaleLowerCase()] = plugin;
  });

  console.log(Object.keys(pluginRegistry).length);
  // process.exit(1);

  const hydratedPlugins: PluginMeta[] = [];

  for (const plugin of plugins) {
    try {
      const tes4Data = await scanTES4Record(plugin.fullPath);

      if (tes4Data) {
        // Build fileToLoadOrderMap: maps file indices to load order indices
        const fileToLoadOrderMap: Record<number, number> = {};

        // Map masters (indices 0 to masterCount-1)
        tes4Data.masters.forEach((masterName, index) => {
          const masterPlugin = pluginRegistry[masterName.toLocaleLowerCase()];
          if (masterPlugin) {
            fileToLoadOrderMap[index] = masterPlugin.loadOrder;
          } else {
            console.warn(
              `[WARN] Could not find master plugin "${masterName}" in registry for ${plugin.name}`
            );
          }
        });

        // Map current plugin (index = masterCount + 1)
        const masterCount = tes4Data.masters.length;
        fileToLoadOrderMap[masterCount + 1] = plugin.loadOrder;

        const hydratedPlugin: PluginMeta = {
          ...plugin,
          masters: tes4Data.masters,
          masterIndexMap: tes4Data.masterIndexMap,
          fileToLoadOrderMap,
        };

        hydratedPlugins.push(hydratedPlugin);
      } else {
        // Keep original plugin if no TES4 data found
        hydratedPlugins.push(plugin);
      }
    } catch (error) {
      console.error(`[ERROR] Failed to hydrate ${plugin.name}:`, error);
      // Keep original plugin on error
      hydratedPlugins.push(plugin);
    }
  }

  console.log(
    `[INFO] Hydration complete - ${hydratedPlugins.length} plugins processed`
  );
  return hydratedPlugins;
}
