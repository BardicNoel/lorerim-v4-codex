# JSON Repair Processor

The JSON Repair Processor is designed to handle and fix malformed JSON data in a pipeline. It processes JSON data line by line and attempts to repair common JSON formatting issues while preserving the original data structure.

## Features

1. **Line-by-Line Processing**: Each record is processed individually to maintain data integrity.
2. **JSON Array Support**: Works with JSON arrays, ensuring the output is a properly formed JSON array.
3. **Character Repair**: Fixes or replaces problematic characters that could cause JSON parsing issues.
4. **Common JSON Issues**: Addresses several common JSON formatting problems:
   - Double commas
   - Missing commas between objects
   - Unclosed objects
   - Invalid characters

## Configuration

The processor can be configured with the following options:

```yaml
type: "repair-json"
options:
  maxAttempts: 3        # Maximum number of repair attempts per record
  strictMode: false     # Whether to throw errors on failed repairs
  preserveOriginal: true # Whether to keep original record if repair fails
```

### Options

- `maxAttempts` (number): Maximum number of repair attempts for each record before giving up
- `strictMode` (boolean): If true, throws errors when repair fails instead of preserving original
- `preserveOriginal` (boolean): If true, keeps the original record when repair fails

## Repair Capabilities

### 1. Double Comma Fix
Fixes instances of double commas in JSON objects:
```json
{"name": "test",, "value": 123} -> {"name": "test", "value": 123}
```

### 2. Missing Comma Fix
Adds missing commas between objects:
```json
{"name": "test"}{"value": 123} -> {"name": "test"},{"value": 123}
```

### 3. Unclosed Object Fix
Adds missing closing braces to unclosed objects:
```json
{"name": "test", "nested": {"value": 123} -> {"name": "test", "nested": {"value": 123}}
```

### 4. Bad Character Replacement
Replaces invalid characters with a special notation:
```json
{"name": "test\u0000"} -> {"name": "test{BAD_CHAR:0}"}
```

## Usage Example

```yaml
name: "json-repair-pipeline"
description: "Pipeline to repair malformed JSON in input data"
input: "../data/input.json"
output: "../data/output.json"
stages:
  - name: "repair-json"
    type: "repair-json"
    description: "Attempts to repair malformed JSON strings in the data"
    options:
      maxAttempts: 3
      strictMode: false
      preserveOriginal: true
```

## Statistics

The processor provides detailed statistics about the repair process:

- `recordsProcessed`: Total number of records processed
- `recordsRepaired`: Number of records that required repairs
- `badCharsReplaced`: Number of invalid characters replaced
- `unclosedObjectsFixed`: Number of unclosed objects fixed
- `doubleCommasFixed`: Number of double commas fixed
- `missingCommasFixed`: Number of missing commas fixed

## Error Handling

- If `preserveOriginal` is true, the processor will return the original record if repair fails
- If `preserveOriginal` is false, the processor will throw an error after `maxAttempts` failed repair attempts
- Invalid characters are replaced with `{BAD_CHAR:<charCode>}` notation to preserve information about the original character 