import fs from 'fs';
import path from 'path';

export interface Config {
  extractedDir: string;
  pluginsTxtPath: string;
  outputDir: string;
  maxThreads: number;
}

export async function loadConfig(configPath?: string): Promise<Config> {
  if (!configPath) {
    throw new Error('No config file specified. Please provide a config file with --config.');
  }

  // Resolve config path relative to current working directory
  const absoluteConfigPath = path.resolve(process.cwd(), configPath);
  const configDir = path.dirname(absoluteConfigPath);
  let configFile: any = {};
  
  try {
    const raw = fs.readFileSync(absoluteConfigPath, 'utf-8');
    configFile = JSON.parse(raw);
  } catch (err) {
    throw new Error(`Failed to read config file: ${err}`);
  }

  // No defaults: all fields must be present
  const mergedConfig: Config = {
    extractedDir: configFile.extractedDir,
    pluginsTxtPath: configFile.pluginsTxtPath,
    outputDir: configFile.outputDir,
    maxThreads: configFile.maxThreads,
  };

  // Resolve all paths relative to config file
  mergedConfig.extractedDir = path.resolve(configDir, mergedConfig.extractedDir);
  mergedConfig.pluginsTxtPath = path.resolve(configDir, mergedConfig.pluginsTxtPath);
  mergedConfig.outputDir = path.resolve(configDir, mergedConfig.outputDir);

  // Clamp maxThreads
  if (typeof mergedConfig.maxThreads !== 'number' || isNaN(mergedConfig.maxThreads)) {
    throw new Error('maxThreads must be a number in the config file.');
  }
  mergedConfig.maxThreads = Math.max(1, Math.min(8, mergedConfig.maxThreads));

  return mergedConfig;
}

export function validateConfig(config: Config): string[] {
  const errors: string[] = [];
  if (!config.extractedDir || !fs.existsSync(config.extractedDir)) {
    errors.push(`Extracted directory not found: ${config.extractedDir}`);
  }
  if (!config.pluginsTxtPath || !fs.existsSync(config.pluginsTxtPath)) {
    errors.push(`Plugins.txt file not found: ${config.pluginsTxtPath}`);
  }
  if (!config.outputDir) {
    errors.push(`Output directory not specified.`);
  } else {
    try {
      if (!fs.existsSync(config.outputDir)) {
        fs.mkdirSync(config.outputDir, { recursive: true });
      }
      fs.accessSync(config.outputDir, fs.constants.W_OK);
    } catch (e) {
      errors.push(`Output directory is not writable: ${config.outputDir}`);
    }
  }
  if (!config.maxThreads || config.maxThreads < 1 || config.maxThreads > 8) {
    errors.push(`maxThreads must be between 1 and 8.`);
  }
  return errors;
} 