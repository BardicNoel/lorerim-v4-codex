# Post-Extract Scripts Processor Guidelines

## Overview

This document outlines the rules and best practices for creating processors and integrating them into the post-extract scripts pipeline. Following these guidelines ensures consistency, maintainability, and proper data handling across all processors.

## Core Requirements

### 1. Pipeline Integration

All processors MUST:

- Be registered in `run-pipeline.ts`
- Support both interactive and command-line operation
- Handle input/output file paths consistently
- Provide clear error messages and validation

### 2. File Handling

- Use streams for processing large files
- Implement proper error handling for file operations
- Validate input/output paths before processing
- Clean up resources (close streams, etc.)

### 3. Data Format Handling

- **Core Processors**: Work with `ParsedRecord[]` format (records with `meta`, `record`, `header`, `decodedData` fields)
- **Doc-Gen Processors**: Work with the actual data format they receive (e.g., skill data directly, perk data directly)
- **Buffer Decoder**: Works with binary data and outputs `ParsedRecord[]` format
- **Other Processors**: May work with either format depending on their purpose

## Processor Structure

### 1. Basic Template

```typescript
class MyProcessor {
  private metadata: ProcessorOutput['metadata'];
  private writeStream: WriteStream;

  constructor(inputFile: string, outputFile: string, options?: any) {
    this.metadata = {
      processor: 'MyProcessor',
      timestamp: new Date().toISOString(),
      inputFile,
      recordType: '', // Set during processing
      recordCount: 0,
    };
  }

  async process(): Promise<void> {
    const writeStream = fs.createWriteStream(this.outputFile);
    writeStream.write('{\n');
    writeStream.write('  "metadata": ' + JSON.stringify(this.metadata, null, 2) + ',\n');
    writeStream.write('  "data": [\n');

    // Process records here
    // Use JsonProcessor for batch processing

    writeStream.write('\n  ]\n}');
    writeStream.end();
  }
}
```

### 2. Batch Processing

Use the JsonProcessor for batch processing:

```typescript
const processor = new JsonProcessor({
  batchSize: 1000,
  onBatch: async (batch: Record[]) => {
    // Process batch
    // Write to output stream
  },
});
```

### 3. Doc-Gen Processor Template

```typescript
export function createMyDocGenerator(config: any): DocGenerator {
  return {
    async generate(data: JsonArray, docConfig: any): Promise<JsonArray> {
      // data contains the actual format (e.g., skill data, perk data)
      // NOT ParsedRecord[] format
      const processedData = processData(data, config);
      return processedData as JsonArray;
    },
    getStats: () => stats,
  };
}
```

## Pipeline Integration

### 1. Registration

Add your processor to `run-pipeline.ts`:

```typescript
const PIPELINES: Record<PipelineType, PipelineConfig> = {
  'my-processor': {
    name: 'My Processor',
    defaultOutputSuffix: '.processed.json',
  },
};
```

### 2. Command Line Support

Implement command-line arguments:

```typescript
if (args.length !== 4) {
  console.error('Usage: npm run my-processor -- <inputFile> <recordType> <profile> <outputFile>');
  process.exit(1);
}
```

## Best Practices

### 1. Error Handling

- Use try/catch blocks for all file operations
- Provide meaningful error messages
- Clean up resources in finally blocks
- Validate input parameters before processing

### 2. Performance

- Use streams for large files
- Process in batches
- Minimize memory usage
- Report progress for long-running operations

### 3. Configuration

- Use YAML for configuration files
- Place configs in the `config` directory
- Follow naming convention: `<recordType>-<purpose>.yaml`
- Include validation for config files

### 4. Testing

- Write unit tests for processors
- Test with various file sizes
- Test error conditions
- Test configuration validation

### 5. Data Format Awareness

- **Core processors**: Test with `ParsedRecord[]` format
- **Doc-gen processors**: Test with actual data format (e.g., skill data directly)
- **Buffer decoders**: Test with binary data and verify `ParsedRecord[]` output
- Document the expected input format clearly

## Example Implementation

Here's a complete example of a processor implementation:

```typescript
import { JsonProcessor } from '../json-processor/src';
import * as fs from 'fs';
import * as path from 'path';

interface ProcessorOutput {
  metadata: {
    processor: string;
    timestamp: string;
    inputFile: string;
    recordType: string;
    profile?: string;
    recordCount: number;
  };
  data: any[];
}

class MyProcessor {
  private metadata: ProcessorOutput['metadata'];
  private writeStream: fs.WriteStream;
  private isFirstRecord: boolean = true;

  constructor(
    private inputFile: string,
    private outputFile: string,
    private recordType: string,
    private profile?: string
  ) {
    this.metadata = {
      processor: 'MyProcessor',
      timestamp: new Date().toISOString(),
      inputFile,
      recordType,
      profile,
      recordCount: 0,
    };
  }

  async process(): Promise<void> {
    try {
      this.writeStream = fs.createWriteStream(this.outputFile);
      this.writeStream.write('{\n');
      this.writeStream.write('  "metadata": ' + JSON.stringify(this.metadata, null, 2) + ',\n');
      this.writeStream.write('  "data": [\n');

      const processor = new JsonProcessor({
        batchSize: 1000,
        onBatch: async (batch: any[]) => {
          const processedBatch = this.processBatch(batch);
          this.writeBatch(processedBatch);
          this.metadata.recordCount += processedBatch.length;
        },
      });

      await processor.processFile(this.inputFile);

      this.writeStream.write('\n  ]\n}');
      this.writeStream.end();
    } catch (error) {
      console.error('Error processing file:', error);
      throw error;
    }
  }

  private processBatch(batch: any[]): any[] {
    // Implement your processing logic here
    return batch;
  }

  private writeBatch(batch: any[]): void {
    for (const record of batch) {
      if (!this.isFirstRecord) {
        this.writeStream.write(',\n');
      }
      this.writeStream.write('    ' + JSON.stringify(record, null, 2));
      this.isFirstRecord = false;
    }
  }
}
```

## Conclusion

Following these guidelines ensures that all processors:

- Handle data consistently
- Integrate properly with the pipeline
- Are maintainable and testable
- Perform efficiently with large files
- Provide proper error handling and reporting
- Work with the correct data format for their purpose
