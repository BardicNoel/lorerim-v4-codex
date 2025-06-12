# Modlist Module

The `modlist.ts` module provides functionality for parsing and handling Mod Organizer 2 (MO2) modlist files and resolving plugin files within mod directories.

## Overview

This module implements a functional approach to:
1. Reading and parsing MO2 modlist files
2. Identifying enabled mods
3. Resolving plugin files within enabled mod directories
4. Handling errors in a type-safe manner

## Types

### ModlistEntry
```typescript
interface ModlistEntry {
  filename: string;    // Name of the plugin file
  loadOrder: number;   // Load order index
  fullPath: string;    // Full path to the plugin file
  modFolder: string;   // Name of the containing mod folder
}
```

### EnabledMod
```typescript
interface EnabledMod {
  name: string;    // Name of the mod
  folder: string;  // Folder name (usually same as name)
}
```

## Functions

### loadEnabledMods
```typescript
function loadEnabledMods(modlistPath: string): TaskEither<Error, string[]>
```

Parses a MO2 modlist file and returns an array of enabled mod names in load order.

**Parameters:**
- `modlistPath`: Path to the modlist.txt file

**Returns:**
- `TaskEither<Error, string[]>`: Either an error or an array of enabled mod names

**Example:**
```typescript
const result = await loadEnabledMods('path/to/modlist.txt')();
if (E.isRight(result)) {
  const enabledMods = result.right;
  // ['ModA', 'ModB', 'ModC']
}
```

### resolvePluginsFromModlist
```typescript
function resolvePluginsFromModlist(
  modlistPath: string,
  pluginNames: string[]
): TaskEither<Error, ModlistEntry[]>
```

Resolves plugin files within enabled mod directories, maintaining load order.

**Parameters:**
- `modlistPath`: Path to the modlist.txt file
- `pluginNames`: Array of plugin filenames to resolve

**Returns:**
- `TaskEither<Error, ModlistEntry[]>`: Either an error or an array of resolved plugin entries

**Example:**
```typescript
const result = await resolvePluginsFromModlist(
  'path/to/modlist.txt',
  ['plugin1.esp', 'plugin2.esp']
)();
if (E.isRight(result)) {
  const plugins = result.right;
  // [
  //   { filename: 'plugin1.esp', loadOrder: 0, fullPath: '...', modFolder: 'ModA' },
  //   { filename: 'plugin2.esp', loadOrder: 1, fullPath: '...', modFolder: 'ModB' }
  // ]
}
```

## Error Handling

The module uses `fp-ts`'s `TaskEither` for error handling. Common errors include:

- File not found
- Path is a directory instead of a file
- Empty modlist file
- Plugin not found in any enabled mod
- Invalid modlist format

## Usage Example

```typescript
import { loadEnabledMods, resolvePluginsFromModlist } from './modlist.js';
import * as E from 'fp-ts/lib/Either.js';

async function processModlist() {
  const modlistPath = 'path/to/modlist.txt';
  const plugins = ['plugin1.esp', 'plugin2.esp'];

  const result = await resolvePluginsFromModlist(modlistPath, plugins)();
  
  if (E.isLeft(result)) {
    console.error('Error:', result.left.message);
    return;
  }

  const resolvedPlugins = result.right;
  // Process resolved plugins...
}
```

## Implementation Details

The module follows functional programming principles:

1. **Pure Functions**: Core parsing and validation logic is pure
2. **Effect Handling**: File system operations are wrapped in `TaskEither`
3. **Error Handling**: Uses `Either` for type-safe error handling
4. **Immutability**: No mutable state or side effects
5. **Function Composition**: Uses `pipe` and `flow` for function composition

## Testing

The module includes comprehensive tests in `modlist.test.ts` that cover:

- Loading enabled mods
- Handling empty modlists
- Handling non-existent files
- Resolving plugins
- Case-insensitive plugin matching
- Error cases

Run tests with:
```bash
npm test
``` 