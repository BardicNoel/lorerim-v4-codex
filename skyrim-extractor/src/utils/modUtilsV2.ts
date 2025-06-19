import { readdir, readFile } from "fs/promises";
import { Config } from "../config";
import path from "path";
import { PluginMeta } from "../types";

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

  // Step 1: Find all files in baseGameDir matching fileExtensions
  const baseGameFiles = await findPluginFiles(config.paths.baseGameDir);
  baseGameFiles.forEach((file) =>
    pluginPaths.set(file, {
      name: file,
      fullPath: path.join(config.paths.baseGameDir, file),
      modFolder: "baseGame",
      index: 0,
    })
  );

  // Step 2: Read modlist.txt
  const { enabled: mods } = await readModlist(config.paths.profileDir);
  // Step 3: Read plugins.txt
  const plugins = await readPlugins(config.paths.profileDir);

  // Travers the modlist in reverse order, and add the plugin to the map, this will ensure we follow the Mo2 override order
  for (const mod of mods.reverse()) {
    const modFiles = await findPluginFiles(path.join(config.paths.modDir, mod));
    modFiles.forEach((file) => {
      pluginPaths.set(file, {
        name: file,
        fullPath: path.join(config.paths.modDir, mod, file),
        modFolder: mod,
        index: mods.indexOf(mod),
      });
    });
  }
  return pluginPaths;
}
