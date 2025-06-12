# Parsing Pipeline

A flexible and extensible data processing pipeline for transforming and analyzing large JSON datasets. The pipeline is designed to be both configurable through a configuration file and accessible through an interactive CLI.

## Project Structure

```
parsing-pipeline/
├── src/
│   ├── cli/                 # Interactive CLI implementation
│   ├── pipeline/           # Core pipeline implementation
│   ├── processors/         # Data processing stages
│   │   ├── trim/          # JSON trimming functionality
│   │   └── json/          # JSON-specific processors
│   ├── types/             # TypeScript type definitions
│   └── utils/             # Shared utilities
├── config/                # Pipeline configuration files
└── docs/                 # Detailed documentation
```

## Components

### 1. Pipeline CLI

The interactive command-line interface that provides easy access to pipeline functionality:

- Run individual pipeline stages for debugging
- Execute full pipeline configurations
- Interactive mode for exploring data transformations
- Helpful command suggestions and documentation

### 2. Pipeline Core

The main pipeline engine that processes data according to configuration:

- Configuration-driven processing
- Stage chaining and dependency management
- Progress tracking and reporting
- Error handling and recovery

### 3. Processors

Individual data processing stages that can be used independently or as part of a pipeline:

- JSON Trimming: Remove unnecessary fields and null values
- JSON Selection: Filter and select specific records
- Random Sampling: Create representative subsets of data
- Custom Processors: Extensible architecture for new processing stages

## Usage

### Running Individual Stages

Each processor can be run independently for debugging:

```bash
# Trim JSON data
npm run trim -- <input> <type> <profile> <output> [--removeNulls] [--overwrite]

# Select winners from JSON
npm run select-winners -- <input> <output> [--criteria] [--overwrite]

# Random sampling
npm run random-sampler -- <input> <output> <count> [--seed] [--overwrite]
```

### Running Full Pipeline

Execute a complete pipeline configuration:

```bash
npm run pipeline -- --config <config-file>
```

### Interactive CLI

Start the interactive CLI:

```bash
npm run cli
```

## Configuration

Pipeline configurations are defined in YAML files:

```yaml
name: "Example Pipeline"
stages:
  - name: "trim"
    type: "json-trim"
    input: "input.json"
    output: "trimmed.json"
    args:
      type: "MGEF"
      profile: "logic"
      removeNulls: true

  - name: "select"
    type: "select-winners"
    input: "trimmed.json"
    output: "selected.json"
    args:
      criteria:
        - field: "type"
          value: "spell"
```

## Development

### Adding New Processors

1. Create a new processor class in `src/processors/`
2. Implement the `Processor` interface
3. Add CLI support in `src/cli/`
4. Update documentation

### Building

```bash
npm run build
```

### Testing

```bash
npm test
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

[Your License Here]
