#!/usr/bin/env node

import { main } from "./index";

function parseArgs(): { configPath: string | undefined; debug: boolean } {
  const args = process.argv.slice(2);
  let configPath: string | undefined;
  let debug = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--config" && i + 1 < args.length) {
      configPath = args[i + 1];
    } else if (args[i] === "--debug") {
      debug = true;
    }
  }

  return { configPath, debug };
}

// Get config path and debug flag from arguments
const { configPath, debug } = parseArgs();
if (!configPath) {
  console.error(
    "Error: No config file specified. Please provide a config file with --config path/to/config.json"
  );
  process.exit(1);
}

// Run the main function
main(configPath, debug).catch((error: unknown) => {
  console.error(
    "Fatal error:",
    error instanceof Error ? error.message : String(error)
  );
  process.exit(1);
});
