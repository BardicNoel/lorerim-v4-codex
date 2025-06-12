# Skyrim Extractor

A Node.js project for parsing Skyrim ESP/ESM binary plugin files.

## Purpose
This tool is designed to efficiently parse and analyze Skyrim mod plugin files (ESP/ESM) for modding, analysis, and automation purposes.

## Prerequisites
- Node.js 18+ installed
- A Mod Organizer 2 modlist.txt file
- Extracted mod folders containing the plugins

## Getting Started
1. Clone the repository and install dependencies:
```bash
git clone <repository-url>
cd skyrim-extractor
npm install
npm run build
```

2. Run the extractor:
```bash
# Run with a specific modlist directory
npm start -- --modlist <path-to-modlist-directory>

# Run with verbose logging enabled
npm start -- --modlist <path-to-modlist-directory> --verbose

# Or use the local test setup
npm run dev:local
```

### Command Line Options
- `--modlist <path>`: (Required) Path to the directory containing modlist.txt
- `--verbose`: (Optional) Enable detailed logging of record parsing

### Directory Structure
The modlist directory should contain:
```
modlist-directory/
├── modlist.txt           # MO2 modlist file
├── ModA/                 # Enabled mod folder
│   └── SomePlugin.esp
├── ModB/                 # Disabled mod folder (ignored)
│   └── AnotherPlugin.esp
└── ModC/                 # Another enabled mod folder
    └── ThirdPlugin.esp
```

### Modlist Format
The `modlist.txt` file should be in MO2 format:
```
+ModA
-ModB
+ModC
```
- Lines starting with `+` indicate enabled mods
- Lines starting with `-` indicate disabled mods
- The order of enabled mods determines the search priority for plugins

## Development
- See `uesp/skyrim_plugin_parser_primer.md` for a technical overview and implementation tips.
- The project uses Node.js streams and buffers for high-performance binary parsing.
- Run tests with `npm test`

### Project Structure
```
skyrim-extractor/
├── src/
│   ├── index.ts          # Entry point
│   ├── modlist.ts        # Modlist parsing
│   └── plugin/           # Plugin parsing logic
├── test-fixtures/        # Test data
├── package.json
└── tsconfig.json
```

## Troubleshooting
1. **"Path is not a file" error**
   - Ensure you're pointing to a directory containing `modlist.txt`
   - The directory should not be the modlist file itself

2. **"Plugin file not found" error**
   - Verify the plugin exists in one of the enabled mod folders
   - Check that the mod folder is enabled in modlist.txt
   - Confirm the plugin filename matches exactly (case-insensitive)

3. **Build errors**
   - Run `npm run build` to ensure TypeScript is compiled
   - Check for any TypeScript errors in the console

## References
- [UESP Mod File Format](https://en.uesp.net/wiki/Skyrim_Mod:Mod_File_Format)
- `uesp/skyrim_plugin_parser_primer.md` (included)
- `uesp/skyrim_record_definitions_full.json` (included)

## Next Steps
- [ ] Add support for plugins.txt
- [ ] Implement binary plugin parsing
- [ ] Add JSON output by record type
- [ ] Add worker thread support for parallel processing