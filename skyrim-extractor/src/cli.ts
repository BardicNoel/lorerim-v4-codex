#!/usr/bin/env node

import { main } from './index';

function parseArgs(): string | undefined {
  const args = process.argv.slice(2);
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--config' && i + 1 < args.length) {
      return args[i + 1];
    }
  }
  return undefined;
}

// Get config path from arguments
const configPath = parseArgs();
if (!configPath) {
  console.error('Error: No config file specified. Please provide a config file with --config path/to/config.json');
  process.exit(1);
}

// Run the main function
main(configPath).catch((error: unknown) => {
  console.error('Fatal error:', error instanceof Error ? error.message : String(error));
  process.exit(1);
}); 