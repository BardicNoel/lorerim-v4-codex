# Buffer Decoder Processor

The Buffer Decoder processor decodes binary data from parsed records into structured JSON data. It supports both single-threaded and multithreaded processing modes.

## Features

- **Single-threaded processing**: Traditional sequential processing for smaller datasets
- **Multithreaded processing**: Parallel processing using worker threads for improved performance on large datasets
- **Plugin metadata support**: Automatic FormID resolution using plugin metadata
- **Progress reporting**: Real-time progress updates during processing
- **Error handling**: Comprehensive error reporting and recovery

## Configuration

### Basic Configuration

```yaml
- name: 'PERK Decoder'
  type: 'buffer-decoder'
  recordType: 'PERK'
  loadPluginMetadata: true
  inputFilePath: 'input/records.json'
  enabled: true
```

### Multithreaded Configuration

```yaml
- name: 'Multithreaded PERK Decoder'
  type: 'buffer-decoder'
  recordType: 'PERK'
  multithreaded: true
  maxWorkers: 4 # Optional: limit worker count
  loadPluginMetadata: true
  inputFilePath: 'input/records.json'
  enabled: true
```

## Configuration Options

| Option               | Type    | Default                 | Description                                         |
| -------------------- | ------- | ----------------------- | --------------------------------------------------- |
| `recordType`         | string  | required                | The type of record to decode (e.g., "PERK", "SPEL") |
| `multithreaded`      | boolean | false                   | Enable multithreaded processing                     |
| `maxWorkers`         | number  | CPU cores (capped at 8) | Maximum number of worker threads                    |
| `loadPluginMetadata` | boolean | false                   | Load plugin metadata for FormID resolution          |
| `pluginMetadataPath` | string  | auto-detected           | Path to plugin metadata file                        |
| `inputFilePath`      | string  | -                       | Path to input file for metadata auto-discovery      |

## Performance Considerations

### When to Use Multithreading

- **Large datasets**: Use multithreading for datasets with thousands of records
- **CPU-intensive processing**: Buffer decoding is CPU-intensive and benefits from parallelization
- **Multiple CPU cores**: Best performance on systems with 4+ CPU cores

### Worker Thread Optimization

- **Default behavior**: Uses all available CPU cores, capped at 8 workers
- **Custom limits**: Use `maxWorkers` to limit worker count for memory-constrained systems
- **Batch sizing**: Automatically calculates optimal batch sizes based on record count

### Memory Usage

- **Worker isolation**: Each worker has its own memory space
- **Batch processing**: Records are processed in batches to manage memory usage
- **Cleanup**: Workers are automatically terminated after processing

## Example Usage

### Single-threaded Processing

```typescript
import { createBufferDecoderProcessor } from './parser';

const config = {
  recordType: 'PERK',
  loadPluginMetadata: true,
  inputFilePath: 'input/records.json',
};

const processor = createBufferDecoderProcessor(config);
const result = await processor.transform(records);
```

### Multithreaded Processing

```typescript
import { createBufferDecoderProcessor } from './parser';

const config = {
  recordType: 'PERK',
  multithreaded: true,
  maxWorkers: 4,
  loadPluginMetadata: true,
  inputFilePath: 'input/records.json',
};

const processor = createBufferDecoderProcessor(config);
const result = await processor.transform(records);
```

## Error Handling

The processor provides comprehensive error handling:

- **Record-level errors**: Individual record failures don't stop processing
- **Worker errors**: Failed workers are reported but don't crash the pipeline
- **Detailed logging**: Error messages include record FormID and field information
- **Graceful degradation**: Falls back to single-threaded mode if worker creation fails

## Progress Reporting

### Single-threaded Mode

- Progress updates every 10% of records processed
- Shows current record FormID and completion percentage

### Multithreaded Mode

- Individual worker progress updates
- Combined statistics from all workers
- Real-time progress from each worker thread

## Troubleshooting

### Common Issues

1. **Worker creation fails**: Check available memory and reduce `maxWorkers`
2. **Plugin metadata not found**: Verify `inputFilePath` and metadata file location
3. **Schema not found**: Ensure `recordType` matches available schemas

### Performance Tips

1. **Optimal worker count**: Start with CPU core count, adjust based on memory
2. **Batch size**: Larger datasets benefit from more workers
3. **Memory monitoring**: Monitor memory usage during processing

## Schema Support

The processor supports various field types:

- **Strings**: UTF-8, UTF-16LE, ASCII encoding
- **Numbers**: uint8, uint16, uint32, float32, int32
- **FormIDs**: 32-bit FormID values with optional resolution
- **Structs**: Nested field structures
- **Arrays**: Variable-length arrays
- **Grouped fields**: Complex field groupings with terminators

See the schema documentation for detailed field type specifications.
