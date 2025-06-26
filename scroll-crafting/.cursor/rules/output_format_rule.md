# Output Format Rule

This rule defines the expected structure and content of the output files (`.json` and `.md`) produced by each generator project.

## Purpose

To ensure that both human-readable and machine-readable outputs are predictable, cleanly formatted, and suitable for both documentation and programmatic consumption.

## Output Types

Each generator must produce:

- `output/<project>.json`: Structured JSON data representing all resolved content
- `output/<project>.md`: Markdown document using templates, ready for publication or review

## Markdown Output (`.md`)

- Generated using `primary.md` and one or more block templates
- Output must:
  - Use headers (`#`, `##`, `###`) for organization
  - Represent content conceptually (e.g., perk descriptions, blessing effects)
  - Avoid raw data fields like FormIDs or subrecord tags unless explicitly required
- Markdown may optionally include frontmatter (`---`) at the top if needed by a static site generator
- All Markdown must be UTF-8 encoded and valid CommonMark

## JSON Output (`.json`)

- Structured JSON array or object, depending on project needs
- Output must:
  - Include all meaningful resolved fields (e.g., name, effects, categories, relationships)
  - Omit plugin-internal keys unless specifically required (e.g., for reference tools)
  - Include full resolution of cross-referenced data where relevant (e.g., resolved `effects[]` with MGEF names)
- Output must be valid JSON (2-space indent, no trailing commas)

### Example JSON Structure (Perk)

```json
{
  "name": "Dual Flurry",
  "tree": "One-Handed",
  "rank": 2,
  "description": "Dual-wielding attacks are 35% faster.",
  "prerequisites": ["Dual Flurry (Rank 1)"]
}
```

## Cursor Agent Notes

- Markdown and JSON must always be written together
- Use clean, pre-resolved context — do not pass plugin-formatted data directly into either output
- Output must match the conceptual framing of the document, not the record layout
- Markdown is for readers; JSON is for systems and GPTs

*This rule is always in effect alongside the Template Construction, Generator Structure, and Code Quality rules.*

