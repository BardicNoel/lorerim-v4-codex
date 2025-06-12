# Pipeline Script Guidelines

[Previous sections remain unchanged...]

## JSON Writing Standards

### Always Use OutputManager
All JSON writing should be done through the `OutputManager` class:

```typescript
import { OutputManager } from './utils/output-manager';

// Initialize output manager
const outputManager = new OutputManager({
    inputPath: inputFile,
    defaultSuffix: '.processed.json',
    customOutputPath: outputPath,
    overwrite: overwrite
});

// Write output
outputManager.writeOutput(data);
```

### Why Use OutputManager?
1. **Consistent Behavior**
   - Standardized file path handling
   - Consistent pretty printing
   - Uniform overwrite behavior

2. **Safety Features**
   - Directory existence checks
   - Write permission validation
   - Overwrite protection

3. **Maintainability**
   - Single point of change for output behavior
   - Consistent logging
   - Standardized error handling

### Common Mistakes to Avoid
1. ❌ Direct `fs.writeFileSync` usage
   ```typescript
   // Don't do this
   fs.writeFileSync(outputFile, JSON.stringify(data, null, 2));
   ```

2. ❌ Manual path construction
   ```typescript
   // Don't do this
   const outputPath = path.join(dirname, `${basename}.json`);
   ```

3. ❌ Skipping validation
   ```typescript
   // Don't do this
   fs.writeFileSync(outputPath, content);
   ```

### Correct Pattern
```typescript
import { OutputManager } from './utils/output-manager';

async function processScript(inputFile: string, outputPath?: string, overwrite?: boolean): Promise<void> {
    // Initialize output manager
    const outputManager = new OutputManager({
        inputPath: inputFile,
        defaultSuffix: '.processed.json',
        customOutputPath: outputPath,
        overwrite: overwrite
    });

    // Validate output path
    if (!outputManager.validateOutputPath()) {
        throw new Error('Invalid output path');
    }

    // Process data...

    // Write output using OutputManager
    outputManager.writeOutput(processedData);
}
```

[Rest of the document remains unchanged...] 