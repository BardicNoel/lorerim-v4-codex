#!/usr/bin/env node

import { program } from './cli';

program.parse(process.argv);

// Export core processors
export * from './processors/core';

// Export utilities
export * from './utils';            