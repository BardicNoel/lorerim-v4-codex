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

### 2. Plugin Processing Workers
Plugins are parsed in parallel using `worker_threads`. Each worker:
- Receives one plugin file and metadata
- Reads binary plugin file
- For each record:
  - Parses 20-byte header → `parseRecordHeader()`
  - Uses `scanSubrecords()` on body
  - Emits `ParsedRecord`
- Returns: `{ status: 'done', plugin: string, records: ParsedRecord[] }`

### 3. Thread Manager
The main process manages plugin workers:
- Limits concurrency (e.g. max 4 at once)
- Queues plugins for processing
- Collects results per worker
- Passes `ParsedRecord` to output aggregator

### 4. Record Aggregator
The aggregator collects parsed records and:
- Buffers or streams them grouped by `meta.type`
- Outputs JSON files: `PERK.json`, `RACE.json`, etc.
- Handles file flushing or memory limits if needed

## Output Organization
Each parsed record will be appended to a type-based array file:
- `PERK.json`, `AVIF.json`, `SPEL.json`, etc.
- Each entry in the array includes:
  - A `meta` block: plugin name, record type, and form ID
  - A `data` block: raw subrecord map
  - The original binary `header` as a base64 string

## TypeScript Interface Specifications

### ParsedRecord
```ts
export interface ParsedRecord {
  meta: {
    type: string;   // e.g., 'PERK'
    formId: string; // e.g., '00058F80'
    plugin: string; // e.g., 'Requiem.esp'
  };
  data: Record<string, Buffer[]>; // Subrecord content by subrecord ID
  header: string; // Raw 20-byte record header in base64
}
```

### Record Header Format
The record header is a **20-byte binary structure** with no field names, just fixed offsets:

| Bytes      | Field               | Notes                         |
|------------|---------------------|-------------------------------|
| `0x00-0x03` | Record Type         | 4 ASCII bytes (e.g., `'PERK'`) |
| `0x04-0x07` | Data Size           | UInt32LE — size of subrecord area only |
| `0x08-0x0B` | Form ID             | UInt32LE — uniquely identifies the record |
| `0x0C-0x0F` | Flags               | UInt32LE — behavior metadata (bitfield) |
| `0x10-0x11` | Version Control Info | UInt16LE — rarely used         |
| `0x12-0x13` | Form Version        | UInt16LE — used by Creation Kit |

Field names are **not stored in the binary**; this layout must be interpreted by byte position.

### `parseRecordHeader(buffer: Buffer): RecordHeader`
```ts
export interface RecordHeader {
  type: string;       // e.g., 'PERK'
  dataSize: number;   // size of subrecord data
  formId: string;     // hex-formatted FormID, e.g., '00058F80'
  flags: number;
  versionControl: number;
  formVersion: number;
  raw: Buffer;        // original 20-byte header
}

export function parseRecordHeader(headerBuf: Buffer): RecordHeader {
  if (headerBuf.length !== 20) {
    throw new Error(`Invalid record header size: ${headerBuf.length} (expected 20)`);
  }

  const type = headerBuf.toString('ascii', 0, 4);
  const dataSize = headerBuf.readUInt32LE(4);
  const formId = headerBuf.readUInt32LE(8).toString(16).toUpperCase().padStart(8, '0');
  const flags = headerBuf.readUInt32LE(12);
  const versionControl = headerBuf.readUInt16LE(16);
  const formVersion = headerBuf.readUInt16LE(18);

  return {
    type,
    dataSize,
    formId,
    flags,
    versionControl,
    formVersion,
    raw: headerBuf,
  };
}
```

### AVIF (Actor Value Information)
```ts
export interface RawAVIF {
  EDID: string;
  FULL: string;
  DESC?: string;
  AVSK?: {
    useMult: number;
    improveMult: number;
    offsetMult: number;
    improveOffset: number;
  };
}
```

### PERK
```ts
export interface RawPERK {
  EDID: string;
  FULL: string;
  DESC?: string;
  DATA: {
    type: number;
    level: number;
    numSubRanks: number;
  };
  PRKE: RawPerkEffect[];
  CNAM?: RawPerkCondition[];
}

export interface RawPerkEffect {
  entryPoint: number;
  functionType: number;
  perkConditionTabIndex: number;
  EPFD: string; // function parameters or FormID
}

export interface RawPerkCondition {
  CTDA: {
    op: number;
    compValue: number;
    func: number;
    param1: number;
    param2: number;
    runOn: number;
    reference?: string;
  };
}
```

### RACE
```ts
export interface RawRACE {
  EDID: string;
  FULL: string;
  DESC?: string;
  DATA: {
    flags: number;
    maleHeight: number;
    femaleHeight: number;
    maleWeight: number;
    femaleWeight: number;
    baseMass: number;
  };
  SPLO?: string[];
  AVSK?: SkillBonus[];
}

export interface SkillBonus {
  skillID: number;
  bonus: number;
}
```

### SPEL
```ts
export interface RawSPEL {
  EDID: string;
  FULL: string;
  SPIT: {
    type: number;
    cost: number;
    flags: number;
  };
  EFID: string[];
}
```

### MGEF
```ts
export interface RawMGEF {
  EDID: string;
  FULL: string;
  DATA: {
    archetype: number;
    baseCost: number;
    flags: number;
    associatedAV: number;
  };
}
```

## Buffer Parsing Utility

### `scanSubrecords(buffer: Buffer)`
A generator function that yields each subrecord within a binary record buffer.

- Uses `function*` for memory-efficient iteration
- Detects and handles `XXXX` extended size subrecords automatically
- Yields `{ type, size, data }` objects for each subrecord

```ts
export function* scanSubrecords(buffer: Buffer): Generator<Subrecord> {
  let offset = 0;
  let useExtendedSize = false;
  let extendedSize = 0;

  while (offset + 6 <= buffer.length) {
    const type = buffer.toString('ascii', offset, offset + 4);

    if (type === 'XXXX') {
      extendedSize = buffer.readUInt32LE(offset + 4);
      console.warn(`Extended subrecord size (XXXX = ${extendedSize}) encountered at offset ${offset}.`);
      useExtendedSize = true;
      offset += 8;
      continue;
    }

    const size = useExtendedSize
      ? extendedSize
      : buffer.readUInt16LE(offset + 4);

    const dataStart = offset + 6;
    const dataEnd = dataStart + size;

    if (dataEnd > buffer.length) {
      throw new Error(`Subrecord '${type}' at offset ${offset} exceeds buffer length.`);
    }

    const data = buffer.slice(dataStart, dataEnd);
    yield { type, size, data };

    offset = dataEnd;
    useExtendedSize = false;
  }
}
```

## Output File Structure
```
/output
├── PERK.json       # Array of all PERK records
├── RACE.json       # Array of all RACE records
├── AVIF.json
├── SPEL.json
├── MGEF.json
└── index.json      # Optional index or summary
```

## Development Phases

### Phase 1: Buffer Parsing Infrastructure
- [x] Create binary header and subrecord parser
- [x] Support `XXXX` extended size subrecords
- [x] Define `ParsedRecord` metadata format and header preservation

### Phase 2: Record Definitions & Export
- [x] Implement thread manager and worker dispatcher
- [ ] Implement output aggregator to buffer and save grouped JSON

### Phase 3: Tooling
- [ ] Generate `.d.ts` from TypeScript types
- [ ] Optionally add Zod schemas for later validation

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
  maxThreads: number;    // Maximum number of worker threads (capped at 8)
}
```

### CLI Interface
The tool provides a command-line interface with the following options:
```bash
skyrim-extractor [options]

Options:
  -c, --config <path>        Path to config file
  -m, --mod-dir <path>       Directory containing modlist.txt and plugins.txt
  -o, --output-dir <path>    Directory for output files
  -t, --threads <number>     Maximum number of worker threads (max 8)
  -h, --help                 Display help information
  -V, --version              Display version information
```

### Environment Variables
The following environment variables can be used to configure the tool:
- `MOD_DIR`: Directory containing modlist.txt and plugins.txt
- `OUTPUT_DIR`: Directory for output files
- `MAX_THREADS`: Maximum number of worker threads (capped at 8)

### Configuration Validation
The configuration is validated before processing starts, checking for:
1. Existence of mod directory and required files (modlist.txt, plugins.txt)
2. Write permissions for the output directory
3. Valid thread count (1-8)

### Example Config File
```json
{
  "modDirPath": "./data/mod-samples",
  "outputPath": "./output",
  "maxThreads": 4
}
```

### Usage Examples
```bash
# Using command line arguments
skyrim-extractor -m ./data/mod-samples -o ./output -t 4

# Using a config file
skyrim-extractor -c config.json

# Using environment variables
MOD_DIR=./data/mod-samples OUTPUT_DIR=./output MAX_THREADS=4 skyrim-extractor
```

---

This spec ensures record reflection from plugin buffers is preserved exactly and consistently, enabling structured JSON output with reliable high-level metadata and raw record headers for traceability.
