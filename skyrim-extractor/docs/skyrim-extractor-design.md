# Skyrim Plugin Record Parser - MVP Schema Specification (Buffer-Level)

## Objective
Define a record parsing layer that operates on in-memory buffers extracted from Skyrim plugin files. This specification reflects **raw binary structures** in JSON, preserving subrecord names and layouts, and adds high-level metadata per record.

## Environment
- Language: **Node.js + TypeScript**
- Output Format: **JSON arrays per record type**, e.g., `PERK.json`, `RACE.json`, with each entry containing metadata and subrecords.

## Input Files and Execution Context
- `modlist.txt`: Load order of installed mods
- `plugins.txt`: Final list of active plugins (load order)
- `<extracted_dir>/`: Directory containing all extracted mod folders (containing `.esp/.esm/.esl` files)

## Planned Architecture

### 1. Plugin Resolver
Responsible for mapping plugin names to full file paths based on `plugins.txt` and extracted folders.

#### Output Interface
```ts
interface PluginMeta {
  name: string;        // e.g., 'Requiem.esp'
  fullPath: string;    // absolute path to plugin binary
  modFolder: string;   // which mod the plugin came from
  index: number;       // load order index from plugins.txt
}
```

#### Steps
1. Read `plugins.txt` and parse plugin names in order
2. Traverse `<extracted_dir>/` and map plugins to full paths by matching names
3. Return sorted array of `PluginMeta`

### 2. Plugin Processing System
Plugins are processed using a thread pool system:
- Configurable number of worker threads (default: min(4, plugin_count))
- Each worker processes one plugin at a time
- Supports record type filtering
- Includes debug logging capabilities
- Returns both buffer metadata and parsed records

### 3. Record Aggregator
The aggregator collects parsed records and:
- Groups them by record type
- Outputs JSON files: `PERK.json`, `RACE.json`, etc.
- Handles file writing with proper error handling

## Output Organization
Each parsed record will be written to type-based array files:
- `PERK.json`, `AVIF.json`, `SPEL.json`, etc.
- Each entry includes metadata and parsed data
- Records are sourced from `@lorerim/platform-types`

## TypeScript Interface Specifications

### Record Header Format
The record header is a simplified structure:

```ts
export interface RecordHeader {
  type: string;
  dataSize: number;
  flags: number;
  formId: number;
  version: number;
  unknown: number;
}
```

### Subrecord Format
```ts
export interface Subrecord {
  type: string;
  size: number;
  data: Buffer;
}
```

## Development Phases

| Phase | Feature | Status | Priority | Notes |
|-------|---------|--------|----------|-------|
| 1 | Buffer Parsing | ✅ | High | Core parsing infrastructure |
| 1 | Record Header Parser | ✅ | High | Simplified header support |
| 1 | Subrecord Scanner | ✅ | High | Basic subrecord support |
| 1 | Record Metadata | ✅ | High | Form ID and type tracking |
| 2 | Thread Pool System | ✅ | High | Configurable worker threads |
| 2 | Plugin Resolution | ✅ | High | Path mapping and validation |
| 2 | Record Type Parsing | ✅ | High | PERK, RACE, AVIF, etc. |
| 2 | JSON Output | ✅ | High | Type-based file generation |
| 3 | Memory Management | ✅ | Medium | Basic buffer handling |
| 3 | Progress Tracking | ✅ | Medium | Worker status reporting |
| 3 | Error Recovery | ⚠️ | Medium | Basic error handling |
| 3 | Validation | ✅ | Medium | Config and data validation |
| 4 | Performance Optimization | ⚠️ | Low | Thread pool optimization |
| 4 | Documentation | ⚠️ | Low | API and usage docs |
| 4 | Testing | ❌ | Low | Unit and integration tests |

### Legend
- ✅ Complete
- ⚠️ In Progress
- ❌ Not Started

### Priority Levels
- **High**: Core functionality required for MVP
- **Medium**: Important for stability and reliability
- **Low**: Nice to have, can be added later

## CLI and Configuration

### Configuration Sources
Configuration can be provided through multiple sources, with the following precedence:
1. Command line arguments
2. Environment variables
3. Config file
4. Default values

### Configuration Interface
```ts
interface Config {
  modDirPath: string;    // Directory containing modlist.txt and plugins.txt
  outputPath: string;    // Directory for output files
  maxThreads: number;    // Maximum number of worker threads
  recordTypeFilter?: string[]; // Optional filter for record types
}
```

### CLI Interface
The tool provides a command-line interface with the following options:
```bash
skyrim-extractor [options]

Options:
  -c, --config <path>        Path to config file
  --debug                    Enable debug logging
  -h, --help                 Display help information
  -V, --version              Display version information
```

### Environment Variables
The following environment variables can be used to configure the tool:
- `MOD_DIR`: Directory containing modlist.txt and plugins.txt
- `OUTPUT_DIR`: Directory for output files
- `MAX_THREADS`: Maximum number of worker threads

### Example Config File
```json
{
  "modDirPath": "./data/mod-samples",
  "outputPath": "./output",
  "maxThreads": 4,
  "recordTypeFilter": ["PERK", "RACE"]
}
```

### Usage Examples
```bash
# Using command line arguments
skyrim-extractor --config config.json --debug

# Using environment variables
MOD_DIR=./data/mod-samples OUTPUT_DIR=./output MAX_THREADS=4 skyrim-extractor --config config.json
```

---

This spec reflects the current state of the skyrim-extractor implementation, focusing on the core functionality of parsing and processing Skyrim plugin files.
