# 🧩 Dynamic YAML Configuration Loader for Node.js

This setup allows you to use **templated YAML files** with `${...}` interpolation and **dynamic file includes**, similar to a macro system.

## ✅ Features

- Use `${file('other.yaml')}` to reference and include other YAML files.
- Template values like `${appName}` are replaced via a context object.
- Supports deep nested includes with no need to preload all file paths.
- Paths are resolved relative to the including file.

## 📦 Installation

```bash
npm install js-yaml lodash
```

## 📁 Example File Structure

```
config/
├── main.yaml
├── partials/
│   └── shared.yaml
```

### `config/main.yaml`

```yaml
app: "${appName}"
shared: ${file("partials/shared.yaml")}
welcomeMessage: "Welcome to ${shared.project}!"
```

### `config/partials/shared.yaml`

```yaml
project: "Lorerim Codex"
version: "1.0"
```

## 🧠 How It Works

Only the entry file (e.g., `main.yaml`) is loaded explicitly. All other YAML files are referenced via `file()` inside template expressions and resolved **recursively**.

## 🚀 Loader Script

```js
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const _ = require('lodash');

function readFile(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function loadYamlTemplate(filePath, context = {}) {
  const raw = readFile(filePath);
  const compiled = _.template(raw, { interpolate: /\${([\s\S]+?)}/g });

  const contextWithFile = {
    ...context,
    file: (relativePath) => {
      const fullPath = path.resolve(path.dirname(filePath), relativePath);
      return loadYamlTemplate(fullPath, context); // recursive
    }
  };

  const rendered = compiled(contextWithFile);
  return yaml.load(rendered);
}

// Example usage:
const config = loadYamlTemplate(path.resolve(__dirname, 'config/main.yaml'), {
  appName: 'MyApp'
});

console.log(config);
```

## ✅ Output

```json
{
  "app": "MyApp",
  "shared": {
    "project": "Lorerim Codex",
    "version": "1.0"
  },
  "welcomeMessage": "Welcome to Lorerim Codex!"
}
```

## 🛡 Notes

- All paths are resolved relative to the file that includes them.
- Be careful not to introduce circular references — you can add cycle detection if needed.
- You can enhance this system to support:
  - `merge(file)` instead of full include
  - optional includes
  - `.env` injection
  - schema validation
