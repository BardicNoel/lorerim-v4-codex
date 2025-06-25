# FormID Resolver Processor Examples

The `formid-resolver` processor can resolve specified fields into global FormIDs using a plugin registry for lookup. This is useful for converting local FormIDs to global FormIDs that can be used across different plugins.

## Configuration Options

### `pluginRegistryPath`

Path to the plugin registry file (JSON format) containing plugin metadata.

### `contextPluginField`

Field path to get the context plugin name (e.g., 'meta.plugin'). This plugin provides the context for resolving FormIDs.

### `targetFields`

Array of fields to resolve, each with:

- `field`: Field path to resolve (e.g., 'decodedData.PNAM')
- `outputField`: Optional output field path (defaults to field + '\_resolved')

### `conditions`

Optional array of conditions to filter which records should be processed.

## Examples

### 1. Basic FormID Resolution

```yaml
- from: 'local'
  name: 'Resolve FormIDs'
  type: 'formid-resolver'
  description: 'Resolve FormIDs in PERK records to global FormIDs'
  pluginRegistryPath: '../output/skyrim-extractor/lorerim/plugin-metadata-map.json'
  contextPluginField: 'meta.plugin'
  targetFields:
    - field: 'decodedData.PNAM'
    - field: 'decodedData.CNAM'
```

**Input:**

```json
[
  {
    "meta": {
      "plugin": "Wintersun.esp",
      "formId": "0x00001234"
    },
    "decodedData": {
      "PNAM": "0x00005678",
      "CNAM": "0x00009ABC"
    }
  }
]
```

**Output:**

```json
[
  {
    "meta": {
      "plugin": "Wintersun.esp",
      "formId": "0x00001234"
    },
    "decodedData": {
      "PNAM": "0x00005678",
      "CNAM": "0x00009ABC",
      "PNAM_resolved": "0x01005678",
      "CNAM_resolved": "0x01009ABC"
    }
  }
]
```

### 2. Conditional FormID Resolution

```yaml
- from: 'local'
  name: 'Resolve Wintersun FormIDs'
  type: 'formid-resolver'
  description: 'Resolve FormIDs only for Wintersun plugin records'
  pluginRegistryPath: '../output/skyrim-extractor/lorerim/plugin-metadata-map.json'
  contextPluginField: 'meta.plugin'
  targetFields:
    - field: 'decodedData.PNAM'
  conditions:
    - field: 'meta.plugin'
      operator: 'contains'
      value: 'Wintersun'
```

### 3. Custom Output Field Names

```yaml
- from: 'local'
  name: 'Resolve FormIDs with Custom Output'
  type: 'formid-resolver'
  description: 'Resolve FormIDs with custom output field names'
  pluginRegistryPath: '../output/skyrim-extractor/lorerim/plugin-metadata-map.json'
  contextPluginField: 'meta.plugin'
  targetFields:
    - field: 'decodedData.PNAM'
      outputField: 'decodedData.PNAM_global'
    - field: 'decodedData.CNAM'
      outputField: 'decodedData.CNAM_global'
```

### 4. Multiple Conditions

```yaml
- from: 'local'
  name: 'Resolve FormIDs with Multiple Conditions'
  type: 'formid-resolver'
  description: 'Resolve FormIDs for specific record types from specific plugins'
  pluginRegistryPath: '../output/skyrim-extractor/lorerim/plugin-metadata-map.json'
  contextPluginField: 'meta.plugin'
  targetFields:
    - field: 'decodedData.PNAM'
  conditions:
    - field: 'meta.plugin'
      operator: 'contains'
      value: 'Wintersun'
    - field: 'meta.type'
      operator: 'equals'
      value: 'PERK'
```

## Use Cases

### Wintersun Religion Analysis

For the Wintersun religion analysis, you might want to resolve FormIDs in PERK records:

```yaml
- from: 'local'
  name: 'Resolve Wintersun PERK FormIDs'
  type: 'formid-resolver'
  description: 'Resolve FormIDs in Wintersun PERK records'
  pluginRegistryPath: '../output/skyrim-extractor/lorerim/plugin-metadata-map.json'
  contextPluginField: 'meta.plugin'
  targetFields:
    - field: 'decodedData.PNAM'
    - field: 'decodedData.CNAM'
    - field: 'decodedData.PRKF'
  conditions:
    - field: 'meta.plugin'
      operator: 'contains'
      value: 'Wintersun'
    - field: 'meta.type'
      operator: 'equals'
      value: 'PERK'
```

### Spell Effect Resolution

For spell effects, you might want to resolve effect references:

```yaml
- from: 'local'
  name: 'Resolve Spell Effect FormIDs'
  type: 'formid-resolver'
  description: 'Resolve effect FormIDs in spell records'
  pluginRegistryPath: '../output/skyrim-extractor/lorerim/plugin-metadata-map.json'
  contextPluginField: 'meta.plugin'
  targetFields:
    - field: 'decodedData.EFID'
      outputField: 'decodedData.EFID_global'
  conditions:
    - field: 'meta.type'
      operator: 'equals'
      value: 'SPEL'
```

## Plugin Registry Format

The plugin registry should be a JSON file with the following structure:

```json
{
  "Skyrim.esm": {
    "name": "Skyrim.esm",
    "fullPath": "/path/to/skyrim.esm",
    "modFolder": "Skyrim",
    "isEsl": false,
    "loadOrder": 0,
    "inTypeOrder": 0,
    "masters": []
  },
  "Wintersun.esp": {
    "name": "Wintersun.esp",
    "fullPath": "/path/to/wintersun.esp",
    "modFolder": "Wintersun",
    "isEsl": false,
    "loadOrder": 1,
    "inTypeOrder": 1,
    "masters": ["Skyrim.esm"]
  }
}
```

## Best Practices

1. **Use conditions** to limit processing to specific records or plugins
2. **Use custom output fields** when you want to preserve the original FormID
3. **Handle missing plugins gracefully** - the processor will log warnings for missing plugins
4. **Test with a small dataset** first to verify the configuration
5. **Check the logs** for resolution failures and warnings

## Error Handling

The processor handles various error conditions:

- **Missing plugin registry**: Throws an error and stops processing
- **Missing context plugin**: Logs a warning and skips the record
- **Invalid FormID format**: Logs a warning and skips the field
- **Resolution failure**: Logs a warning and skips the field

## Statistics

The processor provides the following statistics:

- `recordsProcessed`: Number of records processed
- `formIdsResolved`: Number of FormIDs successfully resolved
- `formIdsFailed`: Number of FormIDs that failed to resolve
