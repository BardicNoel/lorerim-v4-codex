# JSON Processor Module

A TypeScript utility for efficiently processing large JSON files in the LoreRim post-extract scripts pipeline.

## Features

- Memory-efficient processing of large JSON files using streams
- Batch processing support
- Individual item processing support
- TypeScript support with type safety
- Error handling
- Integration with LoreRim post-extract scripts pipeline

## Usage

Here's a basic example of how to use the JSON processor:

```typescript
import { JsonProcessor } from './json-processor/src';

const processor = new JsonProcessor({
  batchSize: 1000,
  onBatch: async (batch) => {
    // Process your batch of items here
    console.log(`Processing batch of ${batch.length} items`);
  },
  onItem: async (item) => {
    // Process individual items here
    console.log('Processing item:', item);
  },
});

// Process your JSON file
await processor.processFile('path/to/your/large/file.json');
```

## Development

Since this module is part of the post-extract-scripts package, you can run it using:

```bash
npm run json-processor:dev
```

## Integration with LoreRim

This JSON processor is designed to be part of the LoreRim post-extract scripts pipeline. It can be used to process large JSON files that are exported from the raw data files, allowing for efficient manipulation and transformation of the data.

## How it Works

The JSON processor uses Node.js streams to process large JSON files efficiently. It:

1. Reads the file as a stream
2. Parses the JSON content
3. Processes items either individually or in batches
4. Handles errors gracefully

This approach ensures that the entire file doesn't need to be loaded into memory at once, making it suitable for processing very large JSON files.

## License

MIT 