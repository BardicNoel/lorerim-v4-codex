import { readdir, readFile } from "fs/promises";
import { Config } from "../config";
import path from "path";
import { PluginMeta } from "@lorerim/platform-types";
import { hydratePluginMetaWithTes4Record } from "../refactor/tes4PluginScan";

/**
 * Read modlist.txt and return array of mod names
 */
export async function readModlist(
  profileDirPath: string
): Promise<{ enabled: string[]; disabled: string[] }> {
  const modlistPath = path.join(profileDirPath, "modlist.txt");
  const content = await readFile(modlistPath, "utf-8");
  const lines = content.split("\n").map((line: string) => line.trim());

  return {
    enabled: lines
      .filter((line) => line.startsWith("+"))
      .map((line) => line.substring(1).trim()),
    disabled: lines
      .filter((line) => line.startsWith("-"))
      .map((line) => line.substring(1).trim()),
  };
}

/**
 * Read loadorder.txt and return array of plugins in load order
 */
export async function readLoadOrder(profileDirPath: string): Promise<string[]> {
  const loadOrderPath = path.join(profileDirPath, "loadorder.txt");
  const content = await readFile(loadOrderPath, "utf-8");
  return content
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#")); // Skip empty lines and comments
}

/**
 * Find all .esp and .esm files in a directory
 */
export async function findPluginFiles(dir: string): Promise<string[]> {
  const files = await readdir(dir, { withFileTypes: true });
  return files
    .filter((file) => file.isFile() && /\.(esp|esm|esl)$/.test(file.name))
    .map((file) => file.name);
}

/**
 * Read plugins.txt and return array of enabled plugins
 */
export async function readPlugins(profileDirPath: string): Promise<string[]> {
  const pluginsPath = path.join(profileDirPath, "plugins.txt");
  const content = await readFile(pluginsPath, "utf-8");
  return content
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("*"))
    .map((line) => line.substring(1).trim());
}

const getRecordFileV2 = async (config: Config) => {
  const loadOrder = await readLoadOrder(config.paths.profileDir);
  const baseGameFiles = await findPluginFiles(config.paths.baseGameDir);
};

export async function getRecordFiles(config: Config) {
  // Create a unique set for storing plugin paths
  const pluginPaths = new Map<string, PluginMeta>();

  // Step 1: Read load order to get the correct plugin indices
  const loadOrder = await readLoadOrder(config.paths.profileDir);
  console.log(`[DEBUG] Load order contains ${loadOrder.length} plugins`);
  console.log(
    `[DEBUG] First 10 plugins in loadorder.txt:`,
    loadOrder.slice(0, 10)
  );

  // Step 2: Find all files in baseGameDir matching fileExtensions
  const baseGameFiles = await findPluginFiles(config.paths.baseGameDir);
  const { enabled: mods } = await readModlist(config.paths.profileDir);

  const pluginPartialMap = new Map<
    string,
    Pick<PluginMeta, "name" | "fullPath" | "modFolder">
  >();

  // We need to hydrate before we can make buffers, so for now we just build a map of paths
  baseGameFiles.forEach((file) => {
    pluginPartialMap.set(file, {
      name: file,
      fullPath: path.join(config.paths.baseGameDir, file),
      modFolder: "baseGame",
    });
  });

  // Overwrite the further down the list we find something.
  for (const modDir of [...mods].reverse()) {
    const modFiles = await findPluginFiles(
      path.join(config.paths.modDir, modDir)
    );
    // Filter to only include plugins that are in the modlist or base game
    modFiles
      .filter((file) => loadOrder.includes(file))
      .forEach((file) => {
        pluginPartialMap.set(file, {
          name: file,
          fullPath: path.join(config.paths.modDir, modDir, file),
          modFolder: modDir,
        });
      });
  }

  const tes4InformedPlugins = await hydratePluginMetaWithTes4Record(
    Array.from(pluginPartialMap.values())
  );

  // Now we need to hydrate the plugins with the load order

  let loadOrderIndex = 0;
  let mainTypeOrderIndex = 0;
  let eslLoadOrderIndex = 0;

  const loadOrderHydratedPlugins: Omit<PluginMeta, "fileToLoadOrderMap">[] = [];
  // We need to read load order from the loadOrder file
  for (const mod of loadOrder) {
    // console.log(`[DEBUG] Mod: ${mod}`);
    const plugin = tes4InformedPlugins.find((plugin) => plugin.name === mod);
    if (plugin) {
      loadOrderHydratedPlugins.push({
        ...plugin,
        loadOrder: loadOrderIndex++,
        inTypeOrder: plugin.isEsl ? eslLoadOrderIndex++ : mainTypeOrderIndex++,
      });
    }
  }

  const pluginRegistry = new Map<string, PluginMeta>();
  loadOrderHydratedPlugins.forEach((plugin) => {
    pluginRegistry.set(plugin.name.toLowerCase(), plugin);
  });

  // Now we need to hydrate the plugins with the fileToLoadOrderMap
  const pluginMetaMap = new Map<string, PluginMeta>();
  loadOrderHydratedPlugins.forEach((plugin) => {
    const fileToLoadOrderMap: Record<number, number> = {};
    plugin.masters?.forEach((masterName, index) => {
      const masterPlugin = pluginRegistry.get(masterName.toLowerCase());
      if (masterPlugin) {
        fileToLoadOrderMap[index] = masterPlugin.loadOrder;
      } else {
        console.warn(
          `[WARN] Could not find master plugin "${masterName}" in registry for ${plugin.name}`
        );
      }
    });

    pluginMetaMap.set(plugin.name, {
      ...plugin,
      fileToLoadOrderMap,
    });
  });

  return pluginMetaMap;
}
