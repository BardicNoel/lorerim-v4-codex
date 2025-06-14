import fs from 'fs';
import path from 'path';

export interface Config {
  modDirPath: string;
  outputPath: string;
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
    modDirPath: configFile.modDirPath,
    outputPath: configFile.outputPath,
    maxThreads: configFile.maxThreads,
  };

  // Resolve all paths relative to config file
  mergedConfig.modDirPath = path.resolve(configDir, mergedConfig.modDirPath);
  mergedConfig.outputPath = path.resolve(configDir, mergedConfig.outputPath);

  // Clamp maxThreads
  if (typeof mergedConfig.maxThreads !== 'number' || isNaN(mergedConfig.maxThreads)) {
    throw new Error('maxThreads must be a number in the config file.');
  }
  mergedConfig.maxThreads = Math.max(1, Math.min(8, mergedConfig.maxThreads));

  return mergedConfig;
}

export function validateConfig(config: Config): string[] {
  const errors: string[] = [];
  if (!config.modDirPath || !fs.existsSync(config.modDirPath)) {
    errors.push(`Mod directory not found: ${config.modDirPath}`);
  }
  if (!config.outputPath) {
    errors.push(`Output directory not specified.`);
  } else {
    try {
      if (!fs.existsSync(config.outputPath)) {
        fs.mkdirSync(config.outputPath, { recursive: true });
      }
      fs.accessSync(config.outputPath, fs.constants.W_OK);
    } catch (e) {
      errors.push(`Output directory is not writable: ${config.outputPath}`);
    }
  }
  if (!config.maxThreads || config.maxThreads < 1 || config.maxThreads > 8) {
    errors.push(`maxThreads must be between 1 and 8.`);
  }
  return errors;
} 