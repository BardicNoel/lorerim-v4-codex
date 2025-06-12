# Parsing Pipeline

A flexible and extensible data processing pipeline for transforming and analyzing large JSON datasets. The pipeline uses a functional approach with YAML-based configuration for defining processing stages.

## Project Structure

```
parsing-pipeline/
├── src/
│   ├── pipeline/           # Core pipeline implementation
│   ├── processors/         # Data processing stages
│   │   └── core/          # Core processing functions
│   ├── types/             # TypeScript type definitions
│   └── utils/             # Shared utilities
├── config/                # Pipeline configuration files
│   └── pipelines/        # Pipeline YAML configurations
└── docs/                 # Detailed documentation
```

## Components

### 1. Pipeline Core

The main pipeline engine that processes data according to YAML configuration:

- YAML-based configuration
- Functional processing stages
- Progress tracking and reporting
- Error handling and recovery

### 2. Processors

Core data processing functions that can be chained in a pipeline:

- Filter Records: Filter records based on conditions
- Remove Fields: Remove specified fields from records
- Keep Fields: Keep only specified fields in records
- Sanitize Fields: Remove or replace fields containing specific patterns

## Usage

### Running a Pipeline

Execute a pipeline defined in a YAML configuration file:

```bash
# From project root
npx ts-node parsing-pipeline/src/scripts/run-pipeline.ts parsing-pipeline/config/pipelines/filter-winners.yaml

# From parsing-pipeline directory
npm run pipeline -- config/pipelines/filter-winners.yaml
```

### Pipeline Configuration

Pipeline configurations are defined in YAML files:

```yaml
name: "Example Pipeline"
version: "1.0.0"
description: "Process user data"
input: "data/raw/input.json"
output: "data/processed/output.json"
stages:
  - name: "filter-records"
    type: "filter-records"
    config:
      conditions:
        - field: "status"
          operator: "equals"
          value: "active"

  - name: "remove-fields"
    type: "remove-fields"
    config:
      fields:
        - "internalId"
        - "metadata"
```

## Development

### Adding New Processors

1. Create a new processor function in `src/processors/core/`
2. Add the processor to the exports in `src/processors/core/index.ts`
3. Update documentation with new processor examples

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
