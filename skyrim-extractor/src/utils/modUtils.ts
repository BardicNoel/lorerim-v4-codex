import { readFile } from "fs/promises";
import { readdir, access } from "fs/promises";
import { join } from "path";
import { PluginMeta } from "../types";

/**
 * Verify that required files exist in the mod directory
 */
export async function verifyModDir(modDirPath: string): Promise<void> {
  try {
    await access(join(modDirPath, "modlist.txt"));
    await access(join(modDirPath, "plugins.txt"));
  } catch (error) {
    throw new Error(
      `Required files not found in ${modDirPath}.\n` +
        `Please ensure modlist.txt and plugins.txt exist in this directory.`
    );
  }
}

/**
 * Get base game plugins from the base game directory
 */
export async function getBaseGamePlugins(
  baseGameDir: string,
  baseGameFiles: string[]
): Promise<PluginMeta[]> {
  if (!baseGameDir) {
    console.warn(
      "Warning: baseGameDir not specified in config. Base game files will not be processed."
    );
    return [];
  }

  try {
    await access(baseGameDir);
  } catch (error) {
    console.warn(
      `Warning: Base game directory not found at ${baseGameDir}. Base game files will not be processed.`
    );
    return [];
  }

  const plugins: PluginMeta[] = [];
  for (let i = 0; i < baseGameFiles.length; i++) {
    const fileName = baseGameFiles[i];
    const fullPath = join(baseGameDir, fileName);
    try {
      await access(fullPath);
      plugins.push({
        name: fileName,
        fullPath,
        modFolder: "Base Game",
        index: i,
      });
    } catch (error) {
      console.warn(`Warning: Base game file not found: ${fullPath}`);
    }
  }

  return plugins;
}

/**
 * Read modlist.txt and return array of mod names
 */
export async function readModlist(modDirPath: string): Promise<string[]> {
  const modlistPath = join(modDirPath, "modlist.txt");
  const content = await readFile(modlistPath, "utf-8");
  return content
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("+"))
    .map((line) => line.substring(1).trim());
}

/**
 * Read plugins.txt and return array of enabled plugins
 */
export async function readPlugins(modDirPath: string): Promise<string[]> {
  const pluginsPath = join(modDirPath, "plugins.txt");
  const content = await readFile(pluginsPath, "utf-8");
  return content
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("*"))
    .map((line) => line.substring(1).trim());
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
 * Get plugin metadata for all enabled plugins
 */
export async function getEnabledPlugins(
  modDirPath: string,
  baseGameDir?: string,
  baseGameFiles?: string[]
): Promise<PluginMeta[]> {
  // First verify required files exist
  await verifyModDir(modDirPath);

  // Get base game plugins first
  const baseGamePlugins =
    baseGameDir && baseGameFiles
      ? await getBaseGamePlugins(baseGameDir, baseGameFiles)
      : [];

  // Get list of mods and enabled plugins
  const mods = await readModlist(modDirPath);
  const enabledPlugins = await readPlugins(modDirPath);

  // Create a map of all available plugins
  const pluginMap = new Map<string, PluginMeta>();

  // Add base game plugins to the map
  for (const plugin of baseGamePlugins) {
    pluginMap.set(plugin.name, plugin);
  }

  // For each mod directory
  for (const modName of mods) {
    const modDir = join(modDirPath, modName);
    try {
      // Find all plugin files in this mod
      const pluginFiles = await findPluginFiles(modDir);

      // Add metadata for each plugin found
      for (const pluginFile of pluginFiles) {
        pluginMap.set(pluginFile, {
          name: pluginFile,
          fullPath: join(modDir, pluginFile),
          modFolder: modName,
          index: -1, // Will be set based on plugins.txt order
        });
      }
    } catch (error) {
      console.warn(`Warning: Could not read mod directory ${modDir}: ${error}`);
    }
  }

  // Create final array maintaining base game order and plugins.txt order for mods
  const plugins: PluginMeta[] = [];

  // First add base game plugins in their original order
  plugins.push(...baseGamePlugins);

  // Then add mod plugins in plugins.txt order
  for (let i = 0; i < enabledPlugins.length; i++) {
    const pluginName = enabledPlugins[i];
    const plugin = pluginMap.get(pluginName);
    if (plugin) {
      // Skip if it's a base game plugin (already added)
      if (plugin.modFolder === "Base Game") continue;

      plugin.index = i + baseGamePlugins.length; // Offset index by number of base game plugins
      plugins.push(plugin);
    } else {
      console.warn(
        `Warning: Enabled plugin ${pluginName} not found in any mod directory`
      );
    }
  }

  if (plugins.length === 0) {
    throw new Error(
      `No enabled plugins found in mod directories.\n` +
        `Mods: ${mods.join(", ")}\n` +
        `Enabled plugins: ${enabledPlugins.join(", ")}`
    );
  }

  return plugins;
}
