# Extract Field Processor Examples

The `extract-field` processor has been enhanced with multiple configuration options to control how extracted fields are handled.

## Configuration Options

### `outputMode`

Controls where extracted data is placed:

- `'root'` (default): Extract to root level, creating new records
- `'sibling'`: Extract to sibling level of the source field
- `'custom'`: Extract to a custom path specified by `outputPath`

### `outputPath`

For `outputMode: 'custom'`, specifies where to place extracted data.

### `preserveSource`

Whether to keep the original field in the source record (default: false).

### `flattenArrays`

Whether to flatten arrays into individual records (default: true).

## Examples

### 1. Root Mode (Original Behavior)

```yaml
- from: 'local'
  name: 'Extract VMAD Properties to Root'
  type: 'extract-field'
  description: 'Extract properties from VMAD scripts and make them top-level documents'
  field: 'decodedData.VMAD.scripts[0].properties'
  outputMode: 'root' # Default behavior
```

**Input:**

```json
{
  "meta": { "isWinner": true },
  "decodedData": {
    "VMAD": {
      "scripts": [
        {
          "properties": [
            { "name": "WSN_DeityName", "value": "Akatosh" },
            { "name": "WSN_DeityDescription", "value": "Dragon God of Time" }
          ]
        }
      ]
    }
  }
}
```

**Output:**

```json
[
  { "name": "WSN_DeityName", "value": "Akatosh" },
  { "name": "WSN_DeityDescription", "value": "Dragon God of Time" }
]
```

### 2. Sibling Mode

```yaml
- from: 'local'
  name: 'Extract VMAD Properties to Sibling Level'
  type: 'extract-field'
  description: 'Extract properties to sibling level of decodedData'
  field: 'decodedData.VMAD.scripts[0].properties'
  outputMode: 'sibling'
  preserveSource: false
```

**Input:**

```json
{
  "meta": { "isWinner": true },
  "decodedData": {
    "VMAD": {
      "scripts": [
        {
          "properties": [
            { "name": "WSN_DeityName", "value": "Akatosh" },
            { "name": "WSN_DeityDescription", "value": "Dragon God of Time" }
          ]
        }
      ]
    }
  }
}
```

**Output:**

```json
[
  {
    "meta": { "isWinner": true },
    "properties": [
      { "name": "WSN_DeityName", "value": "Akatosh" },
      { "name": "WSN_DeityDescription", "value": "Dragon God of Time" }
    ]
  }
]
```

### 3. Custom Path Mode

```yaml
- from: 'local'
  name: 'Extract VMAD Properties to Custom Path'
  type: 'extract-field'
  description: 'Extract properties to a custom path'
  field: 'decodedData.VMAD.scripts[0].properties'
  outputMode: 'custom'
  outputPath: 'extractedProperties'
  preserveSource: true
```

**Input:**

```json
{
  "meta": { "isWinner": true },
  "decodedData": {
    "VMAD": {
      "scripts": [
        {
          "properties": [
            { "name": "WSN_DeityName", "value": "Akatosh" },
            { "name": "WSN_DeityDescription", "value": "Dragon God of Time" }
          ]
        }
      ]
    }
  }
}
```

**Output:**

```json
[
  {
    "meta": { "isWinner": true },
    "decodedData": {
      "VMAD": {
        "scripts": [
          {
            "properties": [
              { "name": "WSN_DeityName", "value": "Akatosh" },
              { "name": "WSN_DeityDescription", "value": "Dragon God of Time" }
            ]
          }
        ]
      }
    },
    "extractedProperties": [
      { "name": "WSN_DeityName", "value": "Akatosh" },
      { "name": "WSN_DeityDescription", "value": "Dragon God of Time" }
    ]
  }
]
```

### 4. Array Flattening Control

```yaml
- from: 'local'
  name: 'Extract Without Flattening Arrays'
  type: 'extract-field'
  description: 'Extract properties without flattening arrays'
  field: 'decodedData.VMAD.scripts[0].properties'
  outputMode: 'sibling'
  flattenArrays: false
```

**Input:**

```json
{
  "meta": { "isWinner": true },
  "decodedData": {
    "VMAD": {
      "scripts": [
        {
          "properties": [
            { "name": "WSN_DeityName", "value": "Akatosh" },
            { "name": "WSN_DeityDescription", "value": "Dragon God of Time" }
          ]
        }
      ]
    }
  }
}
```

**Output:**

```json
[
  {
    "meta": { "isWinner": true },
    "properties": [
      { "name": "WSN_DeityName", "value": "Akatosh" },
      { "name": "WSN_DeityDescription", "value": "Dragon God of Time" }
    ]
  }
]
```

## Use Cases

### Wintersun Religion Analysis

For the Wintersun religion analysis, you might want to extract VMAD properties to make them easier to filter:

```yaml
- from: 'local'
  name: 'Extract Wintersun VMAD Properties'
  type: 'extract-field'
  description: 'Extract VMAD properties to sibling level for easier filtering'
  field: 'decodedData.VMAD.scripts[0].properties'
  outputMode: 'sibling'
  preserveSource: false
```

This makes the properties available at the same level as `meta` and `decodedData`, making them easier to filter in subsequent pipeline stages.

### Complex Nested Data

For deeply nested data structures:

```yaml
- from: 'local'
  name: 'Extract Deep Nested Data'
  type: 'extract-field'
  description: 'Extract deeply nested data to a custom location'
  field: 'decodedData.some.deeply.nested.field'
  outputMode: 'custom'
  outputPath: 'extractedData'
  preserveSource: true
```

## Best Practices

1. **Use `sibling` mode** when you want to keep the record structure but make extracted data more accessible
2. **Use `custom` mode** when you need precise control over where extracted data is placed
3. **Use `root` mode** when you want to completely restructure the data
4. **Set `preserveSource: true`** when you need to keep the original data for reference
5. **Set `flattenArrays: false`** when you want to preserve array structure
