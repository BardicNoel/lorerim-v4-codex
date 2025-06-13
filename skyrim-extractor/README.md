# Skyrim Plugin Record Parser

A Node.js tool for parsing Skyrim plugin files (`.esp`, `.esm`, `.esl`) and extracting their records into structured JSON format.

## Features

- Parses Skyrim plugin files into structured JSON records
- Supports all record types (PERK, RACE, AVIF, SPEL, MGEF, etc.)
- Handles extended size subrecords (XXXX)
- Preserves raw record headers and subrecord data
- Groups records by type in separate JSON files

## Prerequisites

- Node.js 16 or higher
- npm 7 or higher

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

## Usage

1. Create a config file (e.g., `config.json`):
   ```json
   {
     "modDirPath": "./data/mod-samples",
     "outputPath": "./output",
     "maxThreads": 4
   }
   ```

2. Run the parser:
   ```bash
   npm start -- --config config.json
   ```

## Configuration

The tool requires a configuration file with the following options:

- `modDirPath`: Path to directory containing modlist.txt and plugins.txt
- `outputPath`: Path where JSON files will be saved
- `maxThreads`: Number of worker threads to use (1-8)

## Output Format

The parser creates separate JSON files for each record type (e.g., `PERK.json`, `RACE.json`). Each file contains an array of records with the following structure:

```json
{
  "meta": {
    "type": "PERK",
    "formId": "00058F80",
    "plugin": "Requiem.esp"
  },
  "data": {
    "EDID": [Buffer],
    "FULL": [Buffer],
    // ... other subrecords
  },
  "header": "base64_encoded_header"
}
```

## Development

- Build TypeScript:
  ```bash
  npm run build
  ```

- Run in development mode:
  ```bash
  npm run dev
  ```

- Run tests:
  ```bash
  npm test
  ```

## License

MIT 