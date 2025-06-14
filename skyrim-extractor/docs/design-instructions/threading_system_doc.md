# Skyrim Plugin Parsing Thread System

## Thread Manager (`threadManager.ts`)

Manages a pool of worker threads that parse Skyrim plugin binaries.

### Responsibilities
- Accepts a list of `PluginMeta` items.
- Limits the number of concurrent plugin parsing workers.
- Dispatches plugins to available worker threads.
- Collects `ParsedRecord` results from each worker.
- Reports errors if workers fail.

### Key Parameters
- `MAX_CONCURRENCY = 4`: Number of workers allowed in parallel.

### Function Signature
```ts
runThreadPool(
  plugins: PluginMeta[],
  onResult: (record: ParsedRecord) => void,
  onError?: (plugin: string, error: Error) => void
): Promise<void>
```

### Location
`src/thread/threadManager.ts`

---

## Plugin Worker (`pluginWorker.ts`)

Each worker parses one plugin file and returns all parsed records to the main thread.

### Responsibilities
- Loads the binary plugin file.
- Uses `parseRecordHeader()` to extract the record header.
- Uses `scanSubrecords()` to decode the record body.
- Posts a message back to the main thread with the results.

### Message Interface

#### From Main → Worker
```ts
{
  pluginPath: string;
  pluginName: string;
}
```

#### From Worker → Main
```ts
{
  status: 'done',
  plugin: string,
  records: ParsedRecord[]
}
```

### Location
`src/thread/pluginWorker.ts`
