# JSON Processor

A TypeScript utility for efficiently processing large JSON files using streams.

## Features

- Memory-efficient processing of large JSON files using streams
- Batch processing support
- Individual item processing support
- TypeScript support with type safety
- Error handling

## Installation

1. Clone this repository
2. Install dependencies:
```bash
npm install
```

## Usage

Here's a basic example of how to use the JSON processor:

```typescript
import { JsonProcessor } from './src';

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

1. Build the project:
```bash
npm run build
```

2. Run in development mode:
```bash
npm run dev
```

## How it Works

The JSON processor uses Node.js streams to process large JSON files efficiently. It:

1. Reads the file as a stream
2. Parses the JSON content
3. Processes items either individually or in batches
4. Handles errors gracefully

This approach ensures that the entire file doesn't need to be loaded into memory at once, making it suitable for processing very large JSON files.

## License

MIT
