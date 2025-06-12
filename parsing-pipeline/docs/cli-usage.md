# Command Line Interface

The parsing pipeline provides both an interactive CLI and direct command-line access to individual processors.

## Interactive CLI

Start the interactive CLI:

```bash
npm run cli
```

### Features

- Command history and auto-completion
- Built-in help system
- Pipeline configuration management
- Stage execution and monitoring
- Data preview and validation

### Available Commands

```
help                    Show help information
exit                    Exit the CLI
config                  Manage pipeline configurations
  list                 List available configurations
  show <name>          Show configuration details
  create <name>        Create new configuration
  edit <name>          Edit existing configuration
  delete <name>        Delete configuration
run                     Execute pipeline or stage
  pipeline <config>    Run full pipeline
  stage <name>         Run individual stage
  debug <stage>        Debug stage with sample data
preview                 Preview data
  input <file>         Preview input file
  output <file>        Preview output file
  stage <name>         Preview stage output
validate                Validate data or configuration
  config <file>        Validate pipeline config
  data <file>          Validate data file
```

## Direct Command Usage

Each processor can be run directly from the command line for debugging or scripting.

### JSON Trim Processor

```bash
npm run trim -- <input> <type> <profile> <output> [options]

Options:
  --removeNulls        Remove null values
  --overwrite         Overwrite output file if exists
  --batchSize <size>  Number of records to process at once
  --verbose          Show detailed progress
```

Example:
```bash
npm run trim -- "spells.json" "MGEF" "logic" "trimmed-spells.json" --removeNulls --overwrite
```

### Select Winners Processor

```bash
npm run select-winners -- <input> <output> [options]

Options:
  --criteria <json>   Selection criteria in JSON format
  --overwrite        Overwrite output file if exists
  --batchSize <size> Number of records to process at once
  --verbose         Show detailed progress
```

Example:
```bash
npm run select-winners -- "spells.json" "selected-spells.json" --criteria '{"type":"spell","level":"1"}' --overwrite
```

### Random Sampler Processor

```bash
npm run random-sampler -- <input> <output> <count> [options]

Options:
  --seed <number>    Random seed for reproducible sampling
  --overwrite       Overwrite output file if exists
  --batchSize <size> Number of records to process at once
  --verbose        Show detailed progress
```

Example:
```bash
npm run random-sampler -- "spells.json" "sampled-spells.json" 100 --seed 12345 --overwrite
```

## Pipeline Execution

Run a complete pipeline configuration:

```bash
npm run pipeline -- --config <config-file> [options]

Options:
  --dry-run         Show what would be executed without running
  --stage <name>    Run only specified stage
  --skip <names>    Skip specified stages
  --verbose        Show detailed progress
  --parallel      Run independent stages in parallel
```

Example:
```bash
npm run pipeline -- --config "configs/spell-processing.yaml" --verbose
```

## Output Formats

The CLI supports multiple output formats:

```bash
# JSON output
npm run trim -- "spells.json" "MGEF" "logic" "output.json" --format json

# CSV output
npm run trim -- "spells.json" "MGEF" "logic" "output.csv" --format csv

# Pretty-printed JSON
npm run trim -- "spells.json" "MGEF" "logic" "output.json" --format pretty
```

## Error Handling

The CLI provides detailed error information:

```bash
# Show full error details
npm run trim -- "spells.json" "MGEF" "logic" "output.json" --debug

# Continue on error
npm run trim -- "spells.json" "MGEF" "logic" "output.json" --continue

# Retry on failure
npm run trim -- "spells.json" "MGEF" "logic" "output.json" --retry 3
```

## Progress Reporting

Monitor progress of long-running operations:

```bash
# Show progress bar
npm run trim -- "spells.json" "MGEF" "logic" "output.json" --progress

# Show detailed statistics
npm run trim -- "spells.json" "MGEF" "logic" "output.json" --stats

# Log to file
npm run trim -- "spells.json" "MGEF" "logic" "output.json" --log "process.log"
``` 