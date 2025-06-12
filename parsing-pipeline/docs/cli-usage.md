# Command Line Interface

The parsing pipeline provides a simple command-line interface for running data processing pipelines defined in YAML configuration files.

## Running a Pipeline

To run a pipeline, use the following command from the `parsing-pipeline` directory:

```bash
npm run pipeline -- config/pipelines/your-pipeline.yaml
```

### Example

```bash
# Run the filter-winners pipeline
npm run pipeline -- config/pipelines/filter-winners.yaml
```

## Pipeline Configuration

Pipeline configurations are defined in YAML files under the `config/pipelines` directory. Each configuration specifies:

- Pipeline name and description
- Input and output file paths
- A sequence of processing stages

Example configuration:
```yaml
name: "Filter Non-Winning Records"
description: "Filter non-winning records, remove specific fields, and clean up null references"
input: "data/raw/test-data.json"
output: "data/processed/filtered-test-data.json"
stages:
  - name: "Filter Non-Winning Records"
    type: "filter-records"
    description: "Keep only records where winning is false"
    criteria:
      - field: "winning"
        operator: "equals"
        value: false

  - name: "Remove Specific Fields"
    type: "remove-fields"
    description: "Remove Explosion and Projectile fields"
    fields:
      data:
        "Magic Effect Data":
          "DATA - Data":
            - "Explosion"
            - "Projectile"

  - name: "Remove Null References"
    type: "sanitize-fields"
    description: "Recursively remove all fields containing NULL - Null Reference"
    rules:
      - pattern: "NULL - Null Reference"
        action: "remove"
        excludeFields:
          - "plugin"
          - "load_order"
          - "form_id"
          - "full_form_id"
          - "unique_id"
          - "record_type"
          - "editor_id"
          - "winning"
```

## Available Stage Types

### 1. Filter Records
Filters records based on specified criteria.

```yaml
type: "filter-records"
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
  data:
    "Magic Effect Data":
      "DATA - Data":
        - "Explosion"
        - "Projectile"
```

### 3. Keep Fields
Keeps only specified fields in records.

```yaml
type: "keep-fields"
fields:
  - "id"
  - "name"
  - "status"
```

### 4. Sanitize Fields
Removes or replaces fields containing specific patterns.

```yaml
type: "sanitize-fields"
rules:
  - pattern: "NULL - Null Reference"
    action: "remove"
    excludeFields:
      - "plugin"
      - "form_id"
```

## Output

The pipeline will:
1. Process the input file according to the stages defined
2. Write the result to the specified output file
3. Display processing statistics for each stage

Example output:
```
=== Running Pipeline: Filter Non-Winning Records ===
Description: Filter non-winning records, remove specific fields, and clean up null references
Input: data/raw/test-data.json
Output: data/processed/filtered-test-data.json
Stages: 3

Loaded stage: Filter Non-Winning Records
Description: Keep only records where winning is false
Loaded stage: Remove Specific Fields
Description: Remove Explosion and Projectile fields
Loaded stage: Remove Null References
Description: Recursively remove all fields containing NULL - Null Reference

Reading input file...
Read 3 records

Processing data...

Writing output file...

Pipeline completed successfully!
Final output: data/processed/filtered-test-data.json
``` 