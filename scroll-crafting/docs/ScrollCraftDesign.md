# Lorerim Codex Scroll Crafting Design

## Overview

The Lorerim Codex Scroll Crafting system transforms raw Skyrim mod data into polished documentation through a structured, modular approach. The system separates data processing into two clear phases:

1. **Parsing + Preprocessing Pipeline**: For decoding, analysis, and cross-record resolution.
2. **Scroll Crafting Projects**: For producing polished output in both Markdown and JSON formats, specific to different content domains.

This system is built using **Node.js with TypeScript**, prioritizing modularity, structure, and long-term reuse in web or GPT systems.

---

## Directory Structure

```
scroll-crafting/
├── primaries/            # Core reference data (e.g., PERK, ENCH, WEAP, MGEF)
│   ├── perk.json
│   ├── ench.json
│   ├── weap.json
│   └── mgef.json
├── projects/             # Per-content-type generators
│   ├── subclasses/
│   │   ├── generate.ts           # Main generator script
│   │   ├── <project>-logic.md    # Domain logic documentation
│   │   ├── templates/
│   │   │   ├── primary.md        # Main document template
│   │   │   └── <block>.md        # Partial templates for individual items
│   │   ├── logic/
│   │   │   └── resolve<Feature>.ts # Domain-specific processing logic
│   │   ├── __tests__/
│   │   │   └── resolve<Feature>.test.ts # Test coverage
│   │   ├── output/               # Generated files (created by script)
│   │   │   ├── <project>.json
│   │   │   └── <project>.md
│   │   └── records/              # Project-specific records (optional)
│   └── enchanted-weapons/, religion/, etc.
├── types/                # TypeScript schemas for record types
│   ├── perkSchema.ts
│   ├── enchSchema.ts
│   ├── weapSchema.ts
│   └── records.ts
├── utils/                # Shared helpers
│   ├── loadRecordSet.ts
│   ├── findByFormId.ts
│   ├── renderMarkdownTemplate.ts
│   ├── mermaid.ts
│   └── index.ts
├── .cursor/rules/        # Cursor rules for development
├── project-work-rules/   # Project-specific rules
├── rule-generators/      # Rule generation templates
└── package.json          # NPM scripts for each generator
```

---

## Generator Responsibilities

Each generator project:

- **Consumes resolved data** from `primaries/` (with optional project-specific `records/`)
- **Processes and enriches data** through domain-specific logic
- **Generates dual output**:
  - `output/*.json` — machine-readable, used for web projects and GPT ingestion
  - `output/*.md` — human-readable, used in Google Docs or Markdown sites

### Standard Generator Pattern

```typescript
// generate.ts - Standard structure for all generators
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import {
  loadRecordSet,
  findByFormId,
  renderMarkdownTemplate,
} from "../../utils/index.js";
import { resolve<Feature> } from "./logic/resolve<Feature>.js";

// ESM-compatible __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECT_DIR = path.resolve(__dirname);
const RECORD_DIR = path.join(PROJECT_DIR, "records");
const PRIMARY_DIR = path.resolve(__dirname, "../../primaries");
const OUTPUT_DIR = path.join(PROJECT_DIR, "output");
const TEMPLATE_DIR = path.join(PROJECT_DIR, "templates");

async function main() {
  console.log("🚀 Starting <project-name> generation...");

  // 1. Load required record types
  const records = await loadRecordSet<any>(
    "RECORD_TYPE",
    RECORD_DIR,
    PRIMARY_DIR
  );

  // 2. Process records using domain logic
  const processedData = await resolve<Feature>(records);

  // 3. Render Markdown
  const markdown = renderMarkdownTemplate(
    path.join(TEMPLATE_DIR, "primary.md"),
    processedData
  );

  // 4. Write output
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUTPUT_DIR, "<project-name>.md"), markdown);
  fs.writeFileSync(
    path.join(OUTPUT_DIR, "<project-name>.json"),
    JSON.stringify(processedData, null, 2)
  );
}

main().catch((err) => {
  console.error("❌ Error generating <project-name>:", err);
  process.exit(1);
});
```

---

## Data Resolution Strategy

### Record Loading

- **Primary source**: `primaries/<TYPE>.json` (processed records from pipeline)
- **Fallback**: `records/<TYPE>/` (project-specific records if needed)
- **Validation**: Zod schemas ensure type safety and data integrity

### Cross-Record Resolution

- **FormID resolution**: `findByFormId()` utility for linking records
- **Multi-record relationships**: Support for complex data relationships (e.g., WEAP → ENCH → MGEF)
- **Error handling**: Graceful handling of missing or malformed references

### Example: Subclasses Resolution Chain

```
FLST (FormList) → PERK (Perk records) → CTDA (Conditions) → Prerequisites
```

---

## Template System

### Template Structure

Each generator project includes:

- `primary.md` — main layout template with overall document structure
- `<block>.md` — partial templates for individual items (e.g., `perk_block.md`)

### Handlebars Templating

Uses Handlebars-compatible syntax for consistent, maintainable templates:

```markdown
# {{title}}

{{intro}}

## Items

{{#each items}}
{{> item_block }}
{{/each}}
```

### Template Guidelines

- **Semantic field names**: Use descriptive names like `name`, `description`, `prerequisites`
- **Conceptual content**: Focus on human-readable content, not technical metadata
- **No plugin internals**: Avoid exposing FormIDs, EDIDs, or subrecord tags in Markdown
- **Consistent structure**: Maintain uniform formatting across all generators

---

## Domain Logic Implementation

### Logic Module Pattern

```typescript
// logic/resolve<Feature>.ts
export interface <Feature> {
  name: string;
  description: string;
  // ... domain-specific fields
}

export async function resolve<Feature>(
  records: RecordType[]
): Promise<<Feature>[]> {
  // Domain-specific processing logic
  // Cross-record resolution
  // Data transformation and enrichment
}
```

### Key Processing Steps

1. **Data Loading**: Load and validate required record types
2. **Cross-Reference Resolution**: Link related records using FormIDs
3. **Data Transformation**: Convert raw data to semantic structures
4. **Enrichment**: Add computed fields, relationships, and metadata
5. **Validation**: Ensure output meets quality standards

---

## Testing Strategy

### Test Structure

```typescript
// __tests__/resolve<Feature>.test.ts
import { describe, it, expect } from "vitest";
import { resolve<Feature> } from "../logic/resolve<Feature>.js";

describe("resolve<Feature>", () => {
  it("should process records correctly", async () => {
    // Test implementation
  });

  it("should handle missing data gracefully", async () => {
    // Test implementation
  });
});
```

### Testing Requirements

- **Unit tests** for all logic modules
- **Integration tests** for data loading and processing
- **Template rendering tests** with sample data
- **Error handling tests** for edge cases

---

## Package.json Integration

### Generator Scripts

Each project adds a script to `package.json`:

```json
{
  "scripts": {
    "generate:subclasses": "node --loader ts-node/esm projects/subclasses/generate.ts",
    "generate:enchanted-weapons": "node --loader ts-node/esm projects/enchanted-weapons/generate.ts"
  }
}
```

### Execution

```bash
npm run generate:<project-name>
```

---

## Rules and Documentation

### Project Rules

Each project includes:

- **Domain logic documentation** (`<project>-logic.md`)
- **Cursor rules** for development guidance
- **Validation checklists** for quality assurance

### Rule Inheritance

Projects inherit from base rules:

- Code quality standards
- Generator structure patterns
- Data mapping guidelines
- Template construction rules
- Testing requirements

---

## Utilities and Shared Code

### Core Utilities

- `loadRecordSet()` — Load and validate record data
- `findByFormId()` — Cross-record resolution
- `renderMarkdownTemplate()` — Template rendering
- `generateFlowchart()` — Mermaid diagram generation

### Type Safety

- **Zod schemas** for runtime validation
- **TypeScript interfaces** for compile-time safety
- **Strict typing** throughout the codebase

---

## Quality Assurance

### Validation Checklist

Before considering a project complete:

- [ ] All required files exist in correct locations
- [ ] `generate.ts` follows the established pattern
- [ ] Package.json script is added for easy execution
- [ ] Logic modules are fully tested
- [ ] Templates render correctly with sample data
- [ ] Output files are generated in correct format
- [ ] Documentation explains the data relationships
- [ ] Error handling works for edge cases
- [ ] No files are modified outside the project folder

### Code Quality Standards

- **TypeScript** with strict typing
- **ES modules** syntax
- **Functional programming** practices
- **JSDoc comments** for all exported functions
- **100 character line limit**

---

## Future Enhancements

### Planned Features

- **CLI runner** to build all generators
- **Watch mode** for development
- **Incremental builds** for performance
- **Static site integration** (e.g., Astro)
- **Frontmatter export** for Markdown
- **Validation schemas** for output formats

### Scalability Considerations

- **Parallel processing** for large datasets
- **Caching strategies** for repeated lookups
- **Memory optimization** for complex relationships
- **Plugin system** for custom generators

---

## Goals

- **Automate and standardize** doc generation across all content types
- **Decouple preprocessing** from domain-specific formatting
- **Maintain human-readable** Markdown docs while enabling structured JSON
- **Enable reuse** in web applications and GPT systems
- **Ensure consistency** across all generated documentation
- **Support extensibility** for new content types and formats

This design ensures all scroll crafting projects follow consistent patterns while maintaining the flexibility needed for domain-specific requirements.
