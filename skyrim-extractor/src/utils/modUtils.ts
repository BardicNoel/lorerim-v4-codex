import { readFile } from 'fs/promises';
import { readdir, access } from 'fs/promises';
import { join } from 'path';
import { PluginMeta } from '../types';

/**
 * Verify that required files exist in the mod directory
 */
export async function verifyModDir(modDirPath: string): Promise<void> {
  try {
    await access(join(modDirPath, 'modlist.txt'));
    await access(join(modDirPath, 'plugins.txt'));
  } catch (error) {
    throw new Error(
      `Required files not found in ${modDirPath}.\n` +
      `Please ensure modlist.txt and plugins.txt exist in this directory.`
    );
  }
}

/**
 * Read modlist.txt and return array of mod names
 */
export async function readModlist(modDirPath: string): Promise<string[]> {
  const modlistPath = join(modDirPath, 'modlist.txt');
  const content = await readFile(modlistPath, 'utf-8');
  return content
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.startsWith('+'))
    .map(line => line.substring(1).trim());
}

/**
 * Read plugins.txt and return array of enabled plugins
 */
export async function readPlugins(modDirPath: string): Promise<string[]> {
  const pluginsPath = join(modDirPath, 'plugins.txt');
  const content = await readFile(pluginsPath, 'utf-8');
  return content
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.startsWith('*'))
    .map(line => line.substring(1).trim());
}

/**
 * Find all .esp and .esm files in a directory
 */
export async function findPluginFiles(dir: string): Promise<string[]> {
  const files = await readdir(dir, { withFileTypes: true });
  return files
    .filter(file => file.isFile() && (file.name.endsWith('.esp') || file.name.endsWith('.esm')))
    .map(file => file.name);
}

/**
 * Get plugin metadata for all enabled plugins
 */
export async function getEnabledPlugins(modDirPath: string): Promise<PluginMeta[]> {
  // First verify required files exist
  await verifyModDir(modDirPath);

  // Get list of mods and enabled plugins
  const mods = await readModlist(modDirPath);
  const enabledPlugins = await readPlugins(modDirPath);

  const plugins: PluginMeta[] = [];
  let index = 0;

  // For each mod directory
  for (const modName of mods) {
    const modDir = join(modDirPath, modName);
    try {
      // Find all plugin files in this mod
      const pluginFiles = await findPluginFiles(modDir);
      
      // Add metadata for each enabled plugin found
      for (const pluginFile of pluginFiles) {
        if (enabledPlugins.includes(pluginFile)) {
          plugins.push({
            name: pluginFile,
            fullPath: join(modDir, pluginFile),
            modFolder: modName,
            index: index++
          });
        }
      }
    } catch (error) {
      console.warn(`Warning: Could not read mod directory ${modDir}: ${error}`);
    }
  }

  if (plugins.length === 0) {
    throw new Error(
      `No enabled plugins found in mod directories.\n` +
      `Mods: ${mods.join(', ')}\n` +
      `Enabled plugins: ${enabledPlugins.join(', ')}`
    );
  }

  return plugins;
} 