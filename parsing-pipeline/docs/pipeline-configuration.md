# Pipeline Configuration

The pipeline configuration is defined in YAML format and specifies the sequence of processing stages to apply to your data.

## Configuration Structure

```yaml
name: string # Name of the pipeline
description: string # Optional description
input: string # Input file path
output: string # Output file path
stages: # Array of processing stages
  - name: string # Stage name
    type: string # Stage type
    description: string # Optional stage description
    enabled: boolean # Optional, defaults to true
    # Stage-specific configuration
```

## Available Processors

### 1. Filter Records

Filters records based on specified criteria.

```yaml
type: 'filter-records'
criteria:
  - field: string # Field path
    operator: string # equals, not-equals, contains, not-contains, greater-than, less-than
    value: any # Value to compare against
```

Example:

```yaml
- name: 'Filter Active Users'
  type: 'filter-records'
  description: 'Keep only active users'
  criteria:
    - field: 'status'
      operator: 'equals'
      value: 'active'
    - field: 'age'
      operator: 'greater-than'
      value: 18
```

### 2. Remove Fields

Removes specified fields from records.

```yaml
type: 'remove-fields'
fields:
  - 'field1'
  - 'nested.field2'
  - 'deeply.nested.field3'
```

Example:

```yaml
- name: 'Remove Sensitive Data'
  type: 'remove-fields'
  description: 'Remove sensitive user information'
  fields:
    - 'user.password'
    - 'user.ssn'
    - 'user.creditCard'
```

### 3. Keep Fields

Keeps only specified fields in records.

```yaml
type: 'keep-fields'
fields:
  - 'field1'
  - 'field2'
  - 'nested.field3'
```

Example:

```yaml
- name: 'Keep Essential Fields'
  type: 'keep-fields'
  description: 'Keep only essential user information'
  fields:
    - 'id'
    - 'name'
    - 'email'
    - 'status'
```

### 4. Sanitize Fields

Removes or replaces fields containing specific patterns.

```yaml
type: 'sanitize-fields'
rules:
  - pattern: string # Pattern to match
    action: string # remove or replace
    replacement?: string # Value to replace with (if action is replace)
    excludeFields?: string[] # Fields to exclude from checking
```

Example:

```yaml
- name: 'Clean Null References'
  type: 'sanitize-fields'
  description: 'Remove null reference strings'
  rules:
    - pattern: 'NULL - Null Reference'
      action: 'remove'
      excludeFields:
        - 'id'
        - 'name'
```

### 5. Buffer Decoder

Decodes binary record data using predefined schemas. This processor is specifically designed for handling binary data formats with complex structures.

```yaml
type: 'buffer-decoder'
recordType: string # Type of record being decoded (e.g., "PERK", "SPEL")
loadPluginMetadata?: boolean # Whether to load plugin metadata for FormID resolution
pluginMetadataPath?: string # Optional path to plugin-metadata.json (defaults to parentDir/plugin-metadata.json)
```

The buffer decoder supports the following data types:

- Strings (with various encodings)
- Form IDs (special 32-bit identifiers with optional global resolution)
- Numeric types:
  - uint8 (8-bit unsigned integer)
  - uint16 (16-bit unsigned integer)
  - uint32 (32-bit unsigned integer)
  - int32 (32-bit signed integer)
  - float32 (32-bit floating point)
- Structs (nested data structures)
- Arrays (variable-length lists)
- Unknown fields (skipped with length tracking)

**FormID Resolution**: When `loadPluginMetadata` is enabled, the buffer decoder will automatically load plugin metadata from `plugin-metadata.json` in the parent directory of the input file (or from a custom path if specified). This enables global FormID resolution, converting raw FormIDs to globally unique identifiers that include the load order information.

Example:

```yaml
- name: 'Decode Binary Records'
  type: 'buffer-decoder'
  description: 'Decode binary record data into structured format with global FormID resolution'
  recordType: 'PERK'
  loadPluginMetadata: true
  # pluginMetadataPath: "custom/path/plugin-metadata.json"  # Optional custom path
```

Note: The buffer decoder uses predefined schemas for each record type. These schemas are defined in the codebase and cannot be modified through the pipeline configuration. The processor handles complex binary structures including nested objects, arrays, and variable-length fields.

### 6. Flatten Fields

Moves nested fields to the root level of records, making them more accessible for analysis.

```yaml
type: 'flatten-fields'
fields: string[] # Array of field paths to flatten
```

The flatten-fields processor supports:

- Regular field paths: `['decodedData']`
- Array notation: `['perkSections[].PNAM']` - flattens the PNAM object in each perkSections element

Example:

```yaml
- name: 'Flatten decodedData Fields'
  type: 'flatten-fields'
  description: 'Flatten the decodedData field to make nested data more accessible'
  fields: ['decodedData']

- name: 'Flatten PNAM in perkSections'
  type: 'flatten-fields'
  description: 'Flatten the PNAM object inside each perkSections element'
  fields: ['perkSections[].PNAM']
```

### 7. Merge Records

Merges records from a source file into target records based on field mappings.

```yaml
type: 'merge-records'
sourceFile: string # Path to the source records file
sourceRecordType: string # Type of source records (e.g., 'PERK')
mappings:
  - sourceField: string # Unique identifier for the mapping
    targetField: string # Field path in target records (e.g., 'decodedData.perkSections[].PNAM')
    matchField: string # Field to match on in source records (e.g., 'meta.globalFormId')
    dataField: string # Field to pull data from in source records (e.g., 'decodedData')
    matchType: 'exact' | 'contains' | 'array-contains'
mergeField: string # Field to store merged data (when not using overwriteReference)
mergeStrategy: 'first' | 'all' | 'count'
overwriteReference?: boolean # If true, replace original field values with referenced records
```

Example:

```yaml
- name: 'Merge PERK Records'
  type: 'merge-records'
  description: 'Merge PERK records that are referenced by AVIF perkSections'
  sourceFile: '../output/parsing-pipeline/lorerim/perk-analysis.json'
  sourceRecordType: 'PERK'
  mappings:
    - sourceField: 'perk-mapping'
      targetField: 'decodedData.perkSections[].PNAM'
      matchField: 'meta.globalFormId'
      dataField: 'decodedData'
      matchType: 'exact'
  mergeField: 'relatedPerks'
  mergeStrategy: 'first'
  overwriteReference: true
```

### 8. Rename Fields

Renames fields at multiple levels to standardize field names across different record types.

```yaml
type: 'rename-fields'
mappings:
  'oldFieldPath': 'newFieldName' # old path -> new field name
```

The rename-fields processor supports:

- Regular field paths: `'EDID': 'editorId'`
- Nested field paths: `'decodedData.EDID': 'editorId'`
- Array notation: `'perkSections[].EDID': 'editorId'` - renames EDID in each perkSections element

Example:

```yaml
- name: 'Standardize Field Names'
  type: 'rename-fields'
  description: 'Rename EDID fields to editorId for consistency'
  mappings:
    'EDID': 'editorId'
    'decodedData.EDID': 'editorId'
    'perkSections[].EDID': 'editorId'
    'FULL': 'name'
    'perkSections[].FULL': 'name'
```

### 9. Sample Records

Randomly samples a specified number of records from the input data. This is useful for reducing dataset size for testing or analysis purposes.

```yaml
type: 'sample-records'
sampleSize: number # Number of records to sample
method?: 'random' | 'first' | 'last' # Sampling method, defaults to 'random'
seed?: number # Random seed for reproducible sampling
```

The sample-records processor supports:

- **Random sampling**: Shuffles the array and takes the first N records (default)
- **First N records**: Takes the first N records in their original order
- **Last N records**: Takes the last N records in their original order
- **Seeded randomness**: Uses a seed value for reproducible random sampling

Example:

```yaml
- name: 'Sample 500 Records'
  type: 'sample-records'
  description: 'Randomly sample 500 records from the filtered data'
  sampleSize: 500
  method: 'random'
  seed: 12345 # Optional: for reproducible results
```

Note: If the input data has fewer records than the requested sample size, all records will be returned.

## Complete Example

Here's a complete example of a pipeline configuration:

```yaml
name: 'User Data Processing Pipeline'
description: 'Process and clean user data'
input: 'data/raw/users.json'
output: 'data/processed/clean-users.json'
stages:
  - name: 'Filter Active Users'
    type: 'filter-records'
    description: 'Keep only active users'
    criteria:
      - field: 'status'
        operator: 'equals'
        value: 'active'
      - field: 'age'
        operator: 'greater-than'
        value: 18

  - name: 'Remove Sensitive Data'
    type: 'remove-fields'
    description: 'Remove sensitive user information'
    fields:
      - 'user.password'
      - 'user.ssn'
      - 'user.creditCard'

  - name: 'Keep Essential Fields'
    type: 'keep-fields'
    description: 'Keep only essential user information'
    fields:
      - 'id'
      - 'name'
      - 'email'
      - 'status'

  - name: 'Clean Null References'
    type: 'sanitize-fields'
    description: 'Remove null reference strings'
    rules:
      - pattern: 'NULL - Null Reference'
        action: 'remove'
        excludeFields:
          - 'id'
          - 'name'
```

## Notes

1. All processors support nested field paths using dot notation (e.g., "user.profile.name")
2. The filter-records processor supports multiple criteria that are combined using AND logic
3. Field paths in remove-fields and keep-fields are specified as an array of strings
4. The sanitize-fields processor can either remove or replace matching patterns
5. All processors maintain the original data structure and only modify the specified fields
6. The buffer decoder requires binary input data and uses predefined schemas for decoding
