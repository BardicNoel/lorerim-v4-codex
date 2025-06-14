# Pipeline Configuration

The pipeline configuration is defined in YAML format and specifies the sequence of processing stages to apply to your data.

## Configuration Structure

```yaml
name: string              # Name of the pipeline
description: string       # Optional description
input: string            # Input file path
output: string           # Output file path
stages:                  # Array of processing stages
  - name: string        # Stage name
    type: string        # Stage type
    description: string # Optional stage description
    enabled: boolean    # Optional, defaults to true
    # Stage-specific configuration
```

## Stage Types

### 1. Filter Records
Filters records based on specified criteria.

```yaml
type: "filter-records"
criteria:
  - field: string      # Field path
    operator: string   # equals, not-equals, contains, not-contains, greater-than, less-than
    value: any        # Value to compare against
```

Example:
```yaml
- name: "Filter Active Users"
  type: "filter-records"
  description: "Keep only active users"
  criteria:
    - field: "status"
      operator: "equals"
      value: "active"
```

### 2. Remove Fields
Removes specified fields from records.

```yaml
type: "remove-fields"
fields:
  field_path:          # Nested field structure
    nested_field:
      - "field1"
      - "field2"
```

Example:
```yaml
- name: "Remove Sensitive Data"
  type: "remove-fields"
  description: "Remove sensitive user information"
  fields:
    user:
      profile:
        - "password"
        - "ssn"
        - "creditCard"
```

### 3. Keep Fields
Keeps only specified fields in records.

```yaml
type: "keep-fields"
fields:
  - "field1"
  - "field2"
  - "nested.field3"
```

Example:
```yaml
- name: "Keep Essential Fields"
  type: "keep-fields"
  description: "Keep only essential user information"
  fields:
    - "id"
    - "name"
    - "email"
    - "status"
```

### 4. Sanitize Fields
Removes or replaces fields containing specific patterns.

```yaml
type: "sanitize-fields"
rules:
  - pattern: string           # Pattern to match
    action: string           # remove or replace
    replacement?: string     # Value to replace with (if action is replace)
    excludeFields?: string[] # Fields to exclude from checking
```

### 5. Buffer Decoder
Decodes binary record data using predefined schemas.

```yaml
type: "buffer-decoder"
recordType: string          # Type of record being decoded (e.g., "PERK", "SPEL")
```

Example:
```yaml
- name: "Decode Binary Records"
  type: "buffer-decoder"
  description: "Decode binary record data into structured format"
  recordType: "PERK"
```

Note: The buffer decoder uses predefined schemas for each record type. These schemas are defined in the codebase and cannot be modified through the pipeline configuration.

## Complete Example

Here's a complete example of a pipeline configuration:

```yaml
name: "User Data Processing Pipeline"
description: "Process and clean user data"
input: "data/raw/users.json"
output: "data/processed/clean-users.json"
stages:
  - name: "Filter Active Users"
    type: "filter-records"
    description: "Keep only active users"
    criteria:
      - field: "status"
        operator: "equals"
        value: "active"

  - name: "Remove Sensitive Data"
    type: "remove-fields"
    description: "Remove sensitive user information"
    fields:
      user:
        profile:
          - "password"
          - "ssn"
          - "creditCard"

  - name: "Keep Essential Fields"
    type: "keep-fields"
    description: "Keep only essential user information"
    fields:
      - "id"
      - "name"
      - "email"
      - "status"

  - name: "Clean Null References"
    type: "sanitize-fields"
    description: "Remove null reference strings"
    rules:
      - pattern: "NULL - Null Reference"
        action: "remove"
        excludeFields:
          - "id"
          - "name"
          - "email"
          - "status"
``` 