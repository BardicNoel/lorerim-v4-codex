import { readdir, readFile } from "fs/promises";
import { Config } from "../config";
import path from "path";
import { PluginMeta } from "@lorerim/platform-types";
import { hydratePluginMetas } from "../refactor/tes4PluginScan";

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

  // Create case-insensitive lookup map
  const loadOrderMap = new Map<string, number>();

  let mainLoadOrderIndex = 0;
  let eslLoadOrderIndex = 0;
  loadOrder.forEach((plugin) => {
    const pluginName = plugin.toLowerCase();
    if (pluginName.endsWith(".esl")) {
      eslLoadOrderIndex++;
    } else {
      mainLoadOrderIndex++;
    }
    loadOrderMap.set(
      pluginName,
      pluginName.endsWith(".esl") ? eslLoadOrderIndex : mainLoadOrderIndex
    );
  });

  // Step 2: Find all files in baseGameDir matching fileExtensions
  const baseGameFiles = await findPluginFiles(config.paths.baseGameDir);
  baseGameFiles.forEach((file) => {
    const loadOrderIndex = loadOrderMap.get(file.toLowerCase());
    if (loadOrderIndex === undefined) {
      console.log(`[WARN] Plugin not found in loadorder.txt: ${file}`);
    }
    pluginPaths.set(file, {
      name: file,
      fullPath: path.join(config.paths.baseGameDir, file),
      modFolder: "baseGame",
      isEsl: file.endsWith(".esl"),
      loadOrder: loadOrderIndex !== undefined ? loadOrderIndex : 0, // Use load order index for proper FormID resolution
    });
  });

  // Step 3: Read modlist.txt
  const { enabled: mods } = await readModlist(config.paths.profileDir);
  // Step 4: Read plugins.txt
  const plugins = await readPlugins(config.paths.profileDir);

  // Traverse the modlist in reverse order, and add the plugin to the map, this will ensure we follow the Mo2 override order
  for (const mod of mods.reverse()) {
    const modFiles = await findPluginFiles(path.join(config.paths.modDir, mod));
    modFiles.forEach((file) => {
      const loadOrderIndex = loadOrderMap.get(file.toLowerCase());
      if (loadOrderIndex === undefined) {
        console.log(
          `[WARN] Plugin not found in loadorder.txt: ${file} (from mod: ${mod})`
        );
      }
      pluginPaths.set(file, {
        name: file,
        fullPath: path.join(config.paths.modDir, mod, file),
        modFolder: mod,
        loadOrder: loadOrderIndex !== undefined ? loadOrderIndex : 0, // Use load order index for proper FormID resolution
        isEsl: file.endsWith(".esl"),
      });
    });
  }

  // Debug: Show some load order information
  const sortedPlugins = Array.from(pluginPaths.values()).sort(
    (a, b) => a.loadOrder - b.loadOrder
  );
  console.log(`[DEBUG] First 10 plugins in load order:`);
  sortedPlugins.slice(0, 10).forEach((plugin) => {
    console.log(
      `[DEBUG] Load Order ${plugin.loadOrder} (0x${plugin.loadOrder.toString(16).padStart(2, "0")}): ${plugin.name} (${plugin.modFolder})`
    );
  });

  // Step 5: Hydrate plugins with TES4 master information
  console.log(
    `[INFO] Hydrating ${sortedPlugins.length} plugins with TES4 master information...`
  );
  const hydratedPlugins = await hydratePluginMetas(sortedPlugins);
  console.log(
    `[INFO] Hydration complete - ${hydratedPlugins.length} plugins processed`
  );

  // Convert back to Map with hydrated plugins
  const hydratedPluginMap = new Map<string, PluginMeta>();
  hydratedPlugins.forEach((plugin) => {
    hydratedPluginMap.set(plugin.name, plugin);
  });

  return hydratedPluginMap;
}
