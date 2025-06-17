import { readFile } from "fs/promises";
import { readdir, access } from "fs/promises";
import { join } from "path";
import { PluginMeta } from "../types";
import chalk from "chalk";

/**
 * Verify that required files exist in the mod directory
 */
export async function verifyModDir(modDirPath: string): Promise<void> {
  const missingFiles: string[] = [];
  
  try {
    await access(join(modDirPath, "modlist.txt"));
  } catch (error) {
    missingFiles.push("modlist.txt");
  }

  try {
    await access(join(modDirPath, "plugins.txt"));
  } catch (error) {
    missingFiles.push("plugins.txt");
  }

  if (missingFiles.length > 0) {
    throw new Error(
      `Required files not found in ${modDirPath}:\n` +
      `Missing files: ${missingFiles.join(", ")}\n` +
      `Please ensure all required files exist in this directory.`
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
export async function readModlist(modDirPath: string): Promise<{ enabled: string[], disabled: string[] }> {
  const modlistPath = join(modDirPath, "modlist.txt");
  const content = await readFile(modlistPath, "utf-8");
  const lines = content.split("\n").map(line => line.trim());
  
  return {
    enabled: lines
      .filter(line => line.startsWith("+"))
      .map(line => line.substring(1).trim()),
    disabled: lines
      .filter(line => line.startsWith("-"))
      .map(line => line.substring(1).trim())
  };
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
  const { enabled: mods, disabled: disabledMods } = await readModlist(modDirPath);
  const enabledPlugins = await readPlugins(modDirPath);

  // Create a map of all available plugins
  const pluginMap = new Map<string, PluginMeta>();
  const foundPlugins = new Set<string>();
  const disabledPlugins = new Set<string>();

  // Add base game plugins to the map
  for (const plugin of baseGamePlugins) {
    pluginMap.set(plugin.name, plugin);
    foundPlugins.add(plugin.name);
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
        foundPlugins.add(pluginFile);
      }
    } catch (error) {
      console.warn(`Warning: Could not read mod directory ${modDir}: ${error}`);
    }
  }

  // Create final array maintaining base game order and plugins.txt order for mods
  const plugins: PluginMeta[] = [];
  const missingPlugins: string[] = [];

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
      missingPlugins.push(pluginName);
    }
  }

  // Report missing plugins
  if (missingPlugins.length > 0) {
    console.warn(
      chalk.red(
        `Warning: The following enabled plugins were not found in any mod directory:\n` +
        missingPlugins.map(p => `  - ${p}`).join('\n')
      )
    );
  }

  // Find and report disabled plugins
  for (const plugin of pluginMap.values()) {
    if (!enabledPlugins.includes(plugin.name) && plugin.modFolder !== "Base Game") {
      disabledPlugins.add(plugin.name);
    }
  }

  if (disabledPlugins.size > 0) {
    console.warn(
      chalk.yellow(
        `⚠ Warning: The following plugins were found but are not enabled in plugins.txt:\n` +
        Array.from(disabledPlugins).map(p => `  - ${p}`).join('\n')
      )
    );
  }

  // Report disabled mods
  if (disabledMods.length > 0) {
    console.warn(
      chalk.yellow(
        `⚠ Warning: The following mods are disabled in modlist.txt:\n` +
        disabledMods.map(m => `  - ${m}`).join('\n')
      )
    );
  }

  // Report success if no issues found
  if (missingPlugins.length === 0 && disabledPlugins.size === 0 && disabledMods.length === 0) {
    console.log(chalk.green(`✓ All plugins found and properly enabled`));
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
