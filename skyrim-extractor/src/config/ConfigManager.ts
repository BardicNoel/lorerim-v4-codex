import { Config, loadConfig, validateConfig } from '../config';

export class ConfigManager {
  private config: Config | null = null;

  async initialize(configPath?: string): Promise<void> {
    this.config = await loadConfig(configPath);
    const errors = validateConfig(this.config);
    if (errors.length > 0) {
      throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
    }
  }

  getConfig(): Config {
    if (!this.config) {
      throw new Error('ConfigManager not initialized. Call initialize() first.');
    }
    return this.config;
  }
} 