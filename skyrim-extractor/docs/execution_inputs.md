# Skyrim Plugin Parser - Execution Inputs

## Required Inputs

### 1. Extracted Mods Directory
- **Purpose**: Contains all extracted mod folders with plugin files
- **Format**: Directory path
- **Environment Variable**: `EXTRACTED_DIR`
- **Default**: `./extracted`
- **Structure**:
  ```
  <extracted_dir>/
  ├── mod1/
  │   ├── plugin1.esp
  │   └── plugin2.esm
  ├── mod2/
  │   └── plugin3.esp
  └── ...
  ```

### 2. Plugins List
- **Purpose**: Defines the load order of active plugins
- **Format**: Text file (plugins.txt)
- **Environment Variable**: `PLUGINS_TXT`
- **Default**: `./plugins.txt`
- **Format**:
  ```
  Skyrim.esm
  Update.esm
  Dawnguard.esm
  HearthFires.esm
  Dragonborn.esm
  Requiem.esp
  ```

### 3. Output Directory
- **Purpose**: Where parsed JSON files will be saved
- **Format**: Directory path
- **Environment Variable**: `OUTPUT_DIR`
- **Default**: `./output`
- **Structure**:
  ```
  <output_dir>/
  ├── PERK.json
  ├── RACE.json
  ├── AVIF.json
  ├── SPEL.json
  ├── MGEF.json
  └── ...
  ```

## Input Validation

### Extracted Directory
- Must exist
- Must be readable
- Must contain at least one plugin file
- Plugin files must have extensions: `.esp`, `.esm`, or `.esl`

### Plugins List
- Must exist
- Must be readable
- Must contain at least one plugin name
- Plugin names must match files in extracted directory
- Must maintain load order

### Output Directory
- Will be created if it doesn't exist
- Must be writable
- Must have sufficient disk space

## Example Usage

### Environment Variables
```bash
EXTRACTED_DIR=/path/to/extracted/mods
PLUGINS_TXT=/path/to/plugins.txt
OUTPUT_DIR=/path/to/output
```

### Directory Structure Example
```
/path/to/extracted/mods/
├── Requiem/
│   └── Requiem.esp
├── Unofficial Patch/
│   └── Unofficial Skyrim Patch.esp
└── ...

/path/to/plugins.txt
Skyrim.esm
Update.esm
Unofficial Skyrim Patch.esp
Requiem.esp

/path/to/output/
├── PERK.json
├── RACE.json
└── ...
```

## Error Cases

### Missing Inputs
- Extracted directory not found
- Plugins list not found
- No plugin files found in extracted directory
- No valid plugins in plugins list

### Invalid Inputs
- Plugin files not matching plugins list
- Corrupted plugin files
- Insufficient permissions
- Insufficient disk space

### Load Order Issues
- Plugins listed but not found
- Plugins found but not listed
- Invalid plugin file format 