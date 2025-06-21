# Multithreaded Skyrim Plugin Scanner - Development Specification

## 🌟 Overview
This module provides a scalable, thread-safe system to scan binary Skyrim plugin files in parallel, extract record structure metadata, and validate GRUP nesting. It is designed to be used with a large modlist (e.g., 3,000+ plugins), and supports early error detection and modular plugin analysis.

---

## 📊 Input: `PluginMeta[]`
```ts
export interface PluginMeta {
  name: string;        // e.g., 'Requiem.esp'
  fullPath: string;    // Absolute path to the plugin file
  modFolder: string;   // Folder from which the plugin came
  index: number;       // Load order index
}
```

---

## 📄 Output: `BufferMeta[]`
```ts
interface BufferMeta {
  tag: string;               // Record tag or 'GRUP'
  offset: number;            // Byte offset in the file
  endOffset: number;         // End of the record
  size: number;              // Total size of the record or GRUP
  formId?: number;           // For non-GRUP records
  groupType?: number;        // For GRUPs
  label?: number;            // For GRUPs (e.g., 0x4B455250 for 'PERK')
  parentPath: string[];      // Nested GRUP hierarchy
  sourcePlugin: string;      // e.g., 'Requiem.esp'
  modFolder: string;         // e.g., 'Requiem'
  pluginIndex: number;       // e.g., 20
}
```

---

## 🛠️ Architecture

### 1. `ThreadPool.ts`
- Manages a queue of plugin scan tasks
- Limits concurrency to a configured thread count
- Handles structured `info` and `debug` logs from workers

### 2. `PluginWorker.ts`
- Executes in worker threads
- Loads a plugin file
- Scans records using `scanAllBlocks`
- Emits structured log messages
- Sends result or error message

### 3. `scanAllBlocks.ts`
- Recursively scans GRUPs and leaf records
- Returns full flattened `BufferMeta[]`

### 4. `runPluginScan.ts`
- Entry point
- Accepts `PluginMeta[]`
- Dispatches to thread pool
- Collects and returns all results

---

## 📈 Logging Protocol
Workers emit structured messages like:
```ts
{ log: true, level: 'info' | 'debug', message: string }
```
Example:
```
[Requiem.esp] Scanning Requiem.esp
[Requiem.esp] Found 1893 records
```

---

## 💡 Use Case Example
```ts
const results = await runPluginScan(pluginList);
// Flattened metadata across all plugins
```

---

## 🔍 BufferMeta Example

### GRUP (PERK)
```ts
{
  tag: 'GRUP',
  offset: 1048576,
  endOffset: 1059320,
  size: 10744,
  groupType: 0,
  label: 0x4B455250,
  parentPath: [],
  sourcePlugin: 'Requiem.esp',
  modFolder: 'Requiem',
  pluginIndex: 20
}
```

### PERK Record
```ts
{
  tag: 'PERK',
  offset: 1048624,
  endOffset: 1048748,
  size: 124,
  formId: 0x06000812,
  parentPath: ['GRUP:0:4B455250'],
  sourcePlugin: 'Requiem.esp',
  modFolder: 'Requiem',
  pluginIndex: 20
}
```

---

## ✅ Benefits
- Fully parallelized scanning for massive plugin sets
- Recovers nested structure and validates integrity
- Minimal overhead, easy integration
- Compatible with CLI or library usage

---

## 🚀 Next Steps
- Add plugin validation for malformed GRUPs
- Support filtering (e.g., only specific record types)
- Stream results for early aggregation

sequenceDiagram
    participant Main as index.ts
    participant Config as config.ts
    participant ModUtils as modUtils.ts
    participant Scan as runPluginScan.ts
    participant ThreadPool as ThreadPool.ts
    participant Worker as PluginWorker.ts
    participant Scanner as scanAllBlocks.ts
    participant Reports as runReports.ts

    Main->>Config: loadConfig(configPath)
    Config-->>Main: config object

    Main->>ModUtils: getEnabledPlugins(config.modDirPath)
    ModUtils-->>Main: plugins[]

    Main->>Scan: runPluginScan(plugins, options)
    
    Scan->>ThreadPool: new ThreadPool(config)
    ThreadPool->>Worker: createWorker() [x4]
    
    loop For each plugin
        ThreadPool->>Worker: postMessage(plugin)
        Worker->>Scanner: scanAllBlocks(buffer, context)
        Scanner-->>Worker: BufferMeta[]
        Worker-->>ThreadPool: postMessage(results)
    end
    
    ThreadPool-->>Scan: all results[]
    Scan-->>Main: BufferMeta[]

    Main->>Reports: reportPluginSummaries(results)
    Main->>Reports: reportGrupDistribution(results)
    Main->>Reports: reportRecordTypeDistribution(results)

    Reports-->>Main: console output