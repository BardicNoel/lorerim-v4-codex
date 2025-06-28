import { resolveGlobalFromReference, formatFormId, PluginMeta } from '@lorerim/platform-types';
import { promises as fs } from 'fs';
import * as path from 'path';

// Configurable plugin registry path - can be moved later
const PLUGIN_REGISTRY_PATH = '../output/skyrim-extractor/lorerim/plugin-metadata-map.json';

export interface FormIdResolverConfig {
  pluginRegistryPath?: string;
}

export class FormIdResolver {
  private pluginRegistry: Record<string, PluginMeta> = {};
  private isLoaded = false;

  /**
   * Loads the plugin registry from the specified path
   */
  async loadPluginRegistry(config?: FormIdResolverConfig): Promise<void> {
    if (this.isLoaded) {
      return; // Already loaded
    }

    const registryPath = config?.pluginRegistryPath || PLUGIN_REGISTRY_PATH;
    const absolutePath = path.resolve(registryPath);

    try {
      console.log(`[FormID Resolver] Loading plugin registry from: ${absolutePath}`);
      
      const registryData = await fs.readFile(absolutePath, 'utf-8');
      const registry = JSON.parse(registryData);

      // Convert to lowercase keys for case-insensitive lookup
      this.pluginRegistry = Object.fromEntries(
        Object.entries(registry).map(([key, value]) => [key.toLowerCase(), value as PluginMeta])
      );

      console.log(`[FormID Resolver] Loaded ${Object.keys(this.pluginRegistry).length} plugin metadata entries`);
      this.isLoaded = true;
    } catch (error) {
      console.error(`[FormID Resolver] Failed to load plugin registry: ${error}`);
      throw new Error(
        `Failed to load plugin registry: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Parses a FormID string or number to a number
   */
  private parseFormId(formIdValue: string | number): number | null {
    if (typeof formIdValue === 'number') {
      return formIdValue;
    }

    if (typeof formIdValue !== 'string') {
      return null;
    }

    // Remove any prefix and parse as hex
    const cleanFormId = formIdValue.replace(/^0x/i, '');

    // Try parsing as hex first
    let parsed = parseInt(cleanFormId, 16);

    // If hex parsing failed, try parsing as decimal
    if (isNaN(parsed)) {
      parsed = parseInt(cleanFormId, 10);
    }

    return isNaN(parsed) ? null : parsed;
  }

  /**
   * Resolves a FormID to a global FormID using plugin context
   */
  resolveFormId(formIdValue: string | number, contextPluginName: string): string | null {
    if (!this.isLoaded) {
      console.warn('[FormID Resolver] Plugin registry not loaded, cannot resolve FormID');
      return null;
    }

    const rawFormId = this.parseFormId(formIdValue);
    if (rawFormId === null) {
      console.warn(`[FormID Resolver] Invalid FormID format: ${formIdValue}`);
      return null;
    }

    const contextPlugin = this.pluginRegistry[contextPluginName.toLowerCase()];
    if (!contextPlugin) {
      console.warn(
        `[FormID Resolver] Context plugin "${contextPluginName}" not found in registry`
      );
      return null;
    }

    try {
      const globalFormId = resolveGlobalFromReference(rawFormId, contextPlugin, this.pluginRegistry);
      
      if (globalFormId !== null) {
        return formatFormId(globalFormId);
      } else {
        console.warn(
          `[FormID Resolver] Failed to resolve FormID ${formIdValue} for plugin ${contextPluginName}`
        );
        return null;
      }
    } catch (error) {
      console.warn(`[FormID Resolver] Error resolving FormID ${formIdValue}: ${error}`);
      return null;
    }
  }

  /**
   * Checks if the resolver is ready to use
   */
  isReady(): boolean {
    return this.isLoaded && Object.keys(this.pluginRegistry).length > 0;
  }

  /**
   * Gets the number of loaded plugins
   */
  getPluginCount(): number {
    return Object.keys(this.pluginRegistry).length;
  }
}

// Export a singleton instance for convenience
export const formIdResolver = new FormIdResolver(); 