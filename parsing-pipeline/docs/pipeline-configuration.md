# Pipeline Configuration

The pipeline configuration is defined in YAML format and specifies the sequence of processing stages to apply to your data.

## Configuration Structure

```yaml
name: string              # Name of the pipeline
description: string       # Optional description
version: string          # Pipeline version
stages:                  # Array of processing stages
  - name: string        # Stage name (must be unique)
    type: string        # Processor type
    input: string       # Input file path
    output: string      # Output file path
    args: object        # Stage-specific arguments
    dependsOn: string[] # Optional dependencies on other stages
```

## Available Processors

### JSON Trim Processor

Removes specified fields and optionally null values from JSON data.

```yaml
- name: "trim-spells"
  type: "json-trim"
  input: "spells.json"
  output: "trimmed-spells.json"
  args:
    type: "MGEF"           # Record type
    profile: "logic"       # Trim profile name
    removeNulls: true      # Remove null values
```

### Select Winners Processor

Filters records based on specified criteria.

```yaml
- name: "select-spells"
  type: "select-winners"
  input: "trimmed-spells.json"
  output: "selected-spells.json"
  args:
    criteria:
      - field: "type"
        value: "spell"
      - field: "level"
        value: "1"
```

### Random Sampler Processor

Creates a random sample of records.

```yaml
- name: "sample-spells"
  type: "random-sampler"
  input: "selected-spells.json"
  output: "sampled-spells.json"
  args:
    count: 100            # Number of records to sample
    seed: 12345          # Optional random seed
```

## Stage Dependencies

Stages can depend on other stages using the `dependsOn` field:

```yaml
stages:
  - name: "trim"
    type: "json-trim"
    input: "input.json"
    output: "trimmed.json"
    args:
      type: "MGEF"
      profile: "logic"

  - name: "select"
    type: "select-winners"
    input: "trimmed.json"
    output: "selected.json"
    dependsOn: ["trim"]    # Will run after "trim" stage
    args:
      criteria:
        - field: "type"
          value: "spell"
```

## Error Handling

The pipeline supports error handling through the `onError` field:

```yaml
name: "error-handling-example"
stages:
  - name: "process"
    type: "json-trim"
    input: "input.json"
    output: "output.json"
    onError:
      action: "skip"      # Options: skip, retry, fail
      retries: 3          # Number of retries (if action is retry)
      delay: 1000         # Delay between retries in milliseconds
```

## Progress Tracking

Enable progress tracking for stages:

```yaml
stages:
  - name: "process"
    type: "json-trim"
    input: "input.json"
    output: "output.json"
    progress:
      enabled: true
      interval: 1000      # Progress update interval in milliseconds
```

## Example Configuration

Here's a complete example of a pipeline configuration:

```yaml
name: "Spell Processing Pipeline"
description: "Process and analyze spell data"
version: "1.0.0"

stages:
  - name: "trim-spells"
    type: "json-trim"
    input: "spells.json"
    output: "trimmed-spells.json"
    args:
      type: "MGEF"
      profile: "logic"
      removeNulls: true

  - name: "select-level-1"
    type: "select-winners"
    input: "trimmed-spells.json"
    output: "level-1-spells.json"
    dependsOn: ["trim-spells"]
    args:
      criteria:
        - field: "level"
          value: "1"

  - name: "sample-spells"
    type: "random-sampler"
    input: "level-1-spells.json"
    output: "sampled-spells.json"
    dependsOn: ["select-level-1"]
    args:
      count: 100
      seed: 12345
``` 