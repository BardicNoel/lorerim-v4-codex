# Lorerim Codex Doc Generator Design

## Overview

The Lorerim Codex system separates mod data processing into two clear phases:

1. **Parsing + Preprocessing Pipeline**: For decoding, analysis, and cross-record resolution.
2. **Doc Generation Projects**: For producing polished output in both Markdown and JSON formats, specific to different content domains.

This system is built using **Node.js with TypeScript**, prioritizing modularity, structure, and long-term reuse in web or GPT systems.

---

## Directory Structure

```
/scroll-craft/
├── records/              # Raw decoded records grouped by type (e.g., PERK, MGEF)
│   └── PERK/
├── primaries/            # Core reference data (e.g., KYWD, GLOB, AVIF)
│   └── KYWD/, GLOB/
├── pipeline/             # Preprocessing scripts (e.g., ID resolution)
│   └── resolveFormIDs.ts
├── projects/             # Per-content-type generators
│   ├── perks/
│   │   ├── preprocess/   # pipeline config docs for shaping the inputs
│   │   ├── inputs/
│   │   ├── templates/
│   │   ├── output/
│   │   ├── generate.ts
│   │   └── rules.md
│   └── religion/, subclasses/, etc.
└── utils/                # Shared helpers (markdown rendering, record resolution, etc.)
```

---

## Generator Responsibilities

Each generator:

- Consumes resolved data (from `records/`, with fallback to `primaries/`)
- Generates:

  - `output/*.json` — machine-readable, used for web projects and GPT ingestion
  - `output/*.md` — human-readable, used in Google Docs or Markdown sites

---

## Record Resolution Strategy

- Lookup order:

  1. `records/<TYPE>/<formID>.json`
  2. Fallback to `primaries/<TYPE>/<formID>.json`

- This simplifies common reference data that doesn't need scoping per project.

---

## Template System

- Each generator project includes:

  - `primary.md` — main layout template
  - One or more secondary templates (e.g., `perk_block.md`)

- Uses lightweight templating (e.g., string interpolation or Handlebars-style)

### Example Template Structure (`primary.md`)

```md
# {{title}}

{{intro}}

## Items

{{#each items}}
{{> perk_block }}
{{/each}}
```

### Example Secondary Template (`perk_block.md`)

```md
### {{name}}

- **EDID:** `{{edid}}`
- **FormID:** `{{formid}}`
- **Effects:**
  {{#each effects}}
  - {{this}}
    {{/each}}
```

---

## Rules File

Each project includes a `rules.md` file:

- Describes how Cursor agents should write or update the generator
- Documents required fields, expected output format, and linking logic

---

## Utilities (Planned/Shared)

- `loadRecords(type: string, baseDir: string)`
- `resolveReferences(records: Record[])`
- `renderMarkdown(templatePath: string, context: object)`
- `buildJsonOutput(records: Record[])`

---

## Goals

- Automate and standardize doc generation
- Decouple preprocessing from domain-specific formatting
- Maintain human-readable, editable Markdown docs while enabling structured JSON for app/GPT use

---

## Future Enhancements

- Add CLI runner to build all generators
- Add test suite for each generator
- Integrate with a static site builder (e.g., Astro)
- Add frontmatter export for Markdown
