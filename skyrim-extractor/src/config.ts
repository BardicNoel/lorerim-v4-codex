import fs from "fs";
import path from "path";

export interface Config {
  paths: {
    baseGameDir: string;
    profileDir: string;
    outputDir: string;
    modDir: string;
  };
  maxThreads: number;
  recordTypeFilter?: string[];
}

export async function loadConfig(configPath?: string): Promise<Config> {
  if (!configPath) {
    throw new Error(
      "No config file specified. Please provide a config file with --config."
    );
  }

  // Resolve config path relative to current working directory
  const absoluteConfigPath = path.resolve(process.cwd(), configPath);
  const configDir = path.dirname(absoluteConfigPath);
  let configFile: any = {};

  try {
    const raw = fs.readFileSync(absoluteConfigPath, "utf-8");
    configFile = JSON.parse(raw);
  } catch (err) {
    throw new Error(`Failed to read config file: ${err}`);
  }

  // No defaults: all fields must be present
  const mergedConfig: Config = {
    paths: {
      baseGameDir: configFile.paths?.baseGameDir,
      profileDir: configFile.paths?.profileDir,
      outputDir: configFile.paths?.outputDir,
      modDir: configFile.paths?.modDir,
    },
    maxThreads: configFile.maxThreads,
    recordTypeFilter: configFile.recordTypeFilter,
  };

  // Resolve all paths relative to config file (only if they're not already absolute)
  mergedConfig.paths.baseGameDir = path.isAbsolute(
    mergedConfig.paths.baseGameDir
  )
    ? mergedConfig.paths.baseGameDir
    : path.resolve(configDir, mergedConfig.paths.baseGameDir);
  mergedConfig.paths.profileDir = path.isAbsolute(mergedConfig.paths.profileDir)
    ? mergedConfig.paths.profileDir
    : path.resolve(configDir, mergedConfig.paths.profileDir);
  mergedConfig.paths.outputDir = path.isAbsolute(mergedConfig.paths.outputDir)
    ? mergedConfig.paths.outputDir
    : path.resolve(configDir, mergedConfig.paths.outputDir);
  mergedConfig.paths.modDir = path.isAbsolute(mergedConfig.paths.modDir)
    ? mergedConfig.paths.modDir
    : path.resolve(configDir, mergedConfig.paths.modDir);

  // Clamp maxThreads
  if (
    typeof mergedConfig.maxThreads !== "number" ||
    isNaN(mergedConfig.maxThreads)
  ) {
    throw new Error("maxThreads must be a number in the config file.");
  }
  mergedConfig.maxThreads = Math.max(1, Math.min(8, mergedConfig.maxThreads));

  // Validate recordTypeFilter if present
  if (
    mergedConfig.recordTypeFilter &&
    !Array.isArray(mergedConfig.recordTypeFilter)
  ) {
    throw new Error("recordTypeFilter must be an array of strings.");
  }

  return mergedConfig;
}

export function validateConfig(config: Config): string[] {
  const errors: string[] = [];
  if (!config.paths.modDir || !fs.existsSync(config.paths.modDir)) {
    errors.push(`Mod directory not found: ${config.paths.modDir}`);
  }
  if (!config.paths.outputDir) {
    errors.push(`Output directory not specified.`);
  } else {
    try {
      if (!fs.existsSync(config.paths.outputDir)) {
        fs.mkdirSync(config.paths.outputDir, { recursive: true });
      }
      fs.accessSync(config.paths.outputDir, fs.constants.W_OK);
    } catch (e) {
      errors.push(
        `Output directory is not writable: ${config.paths.outputDir}`
      );
    }
  }
  if (!config.maxThreads || config.maxThreads < 1 || config.maxThreads > 8) {
    errors.push(`maxThreads must be between 1 and 8.`);
  }
  if (config.recordTypeFilter && !Array.isArray(config.recordTypeFilter)) {
    errors.push(`recordTypeFilter must be an array of strings.`);
  }
  if (!config.paths.profileDir || !fs.existsSync(config.paths.profileDir)) {
    errors.push(`Profile directory not found: ${config.paths.profileDir}`);
  }
  if (!config.paths.baseGameDir || !fs.existsSync(config.paths.baseGameDir)) {
    errors.push(`Base game directory not found: ${config.paths.baseGameDir}`);
  }
  return errors;
}
