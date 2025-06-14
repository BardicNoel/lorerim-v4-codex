import fs from 'fs';
import path from 'path';
import { PluginMeta } from './types';

export async function resolveMods(pluginsTxtPath: string, extractedDir: string): Promise<PluginMeta[]> {
  console.log(`Reading plugins from: ${pluginsTxtPath}`);
  console.log(`Looking for plugin files in: ${extractedDir}`);

  const plugins: PluginMeta[] = [];
  const pluginsTxt = await fs.promises.readFile(pluginsTxtPath, 'utf-8');
  const pluginNames = pluginsTxt.split('\n')
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('#'));

  console.log(`Found ${pluginNames.length} plugins in plugins.txt`);

  for (const [index, pluginName] of pluginNames.entries()) {
    // Strip the * prefix if present to get the actual plugin filename
    const actualPluginName = pluginName.startsWith('*') ? pluginName.slice(1) : pluginName;
    
    // Get the base name without extension for the mod folder
    const baseName = path.basename(actualPluginName, path.extname(actualPluginName));
    const modFolder = path.join(extractedDir, baseName);
    const pluginPath = path.join(modFolder, actualPluginName);
    
    if (await fs.promises.access(pluginPath).then(() => true).catch(() => false)) {
      plugins.push({
        name: actualPluginName,
        fullPath: pluginPath,
        modFolder,
        index
      });
      console.log(`  ✓ Found: ${actualPluginName} in ${modFolder}`);
    } else {
      console.warn(`  ✗ Not found: ${actualPluginName}`);
      console.warn(`    Expected at: ${pluginPath}`);
    }
  }

  if (plugins.length === 0) {
    throw new Error('No valid plugin files found. Please check your plugins.txt and extracted directory paths.');
  }

  return plugins;
} 