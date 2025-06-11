import { createReadStream } from 'fs';
import { pipeline } from 'stream/promises';
import { parser } from 'stream-json';
import { streamArray } from 'stream-json/streamers/StreamArray';
import { chain } from 'stream-chain';
import through2 from 'through2';

export interface JsonProcessorOptions {
  batchSize?: number;
  onBatch?: (batch: any[]) => Promise<void>;
  onItem?: (item: any) => Promise<void>;
}

export class JsonProcessor {
  private options: Required<JsonProcessorOptions>;

  constructor(options: JsonProcessorOptions = {}) {
    this.options = {
      batchSize: options.batchSize ?? 1000,
      onBatch: options.onBatch ?? (async () => {}),
      onItem: options.onItem ?? (async () => {})
    };
  }

  async processFile(filePath: string): Promise<void> {
    const pipeline = chain([
      createReadStream(filePath),
      parser(),
      streamArray(),
      this.createProcessingStream(),
    ]);

    return new Promise((resolve, reject) => {
      pipeline.on('end', resolve);
      pipeline.on('error', reject);
    });
  }

  private createProcessingStream() {
    let batch: any[] = [];

    return through2.obj(
      async (chunk: any, enc: string, callback: (error?: Error | null) => void) => {
        try {
          const item = chunk.value;
          
          await this.options.onItem(item);

          batch.push(item);

          if (batch.length >= this.options.batchSize) {
            await this.options.onBatch(batch);
            batch = [];
          }

          callback();
        } catch (error) {
          callback(error as Error);
        }
      },
      async (callback: (error?: Error | null) => void) => {
        try {
          if (batch.length > 0) {
            await this.options.onBatch(batch);
          }
          callback();
        } catch (error) {
          callback(error as Error);
        }
      }
    );
  }
}

// Example usage:
async function main() {
  const processor = new JsonProcessor({
    batchSize: 1000,
    onBatch: async (batch) => {
      console.log(`Processing batch of ${batch.length} items`);
      // Process your batch here
    },
    onItem: async (item) => {
      // Process individual items here
      console.log('Processing item:', item);
    },
  });

  try {
    await processor.processFile('path/to/your/large/file.json');
    console.log('Processing completed successfully');
  } catch (error) {
    console.error('Error processing file:', error);
  }
}

// Uncomment to run the example
// main(); 