# Data Mapping & Resolution Rule

This rule defines how raw record data must be mapped, transformed, and resolved before being passed into output templates. It governs the structure, naming, and enrichment process used to convert plugin records into high-level structured data.

## Purpose

To create clean, consistent, and concept-driven data structures from Skyrim plugin records, suitable for Markdown and JSON output. This mapping layer acts as the semantic bridge between raw record formats and user-facing content.

## Responsibilities

- Interpret record relationships through both schema linkers and project logic
- Resolve references across records (e.g., `SPEL` → `MGEF`, `PERK` prerequisites)
- Collapse and clean plugin data into simplified, readable structures
- Rename or reshape fields for human understanding (e.g., `edid` → `name`, `dnam` → `effectDescription`)

## Mapping Process

- Mapping is performed in `logic/` or `utils/`, not templates
- All mappings should be typed and consistent per record type
- Contextual meaning should guide output field names (e.g., `prerequisites`, `blessingEffects`, `draconicCategory`)

## Examples

### Raw:

```json
{
  "EDID": "PerkDualFlurry02",
  "FULL": "Dual Flurry",
  "PRKE": ["00058F60"],
  "DNAM": { "description": "Dual-wielding attacks are 35% faster." }
}
```

### Mapped:

```json
{
  "name": "Dual Flurry",
  "rank": 2,
  "prerequisites": ["Dual Flurry (Rank 1)"],
  "description": "Dual-wielding attacks are 35% faster."
}
```

## Cursor Agent Notes

- Always transform record data into high-level structures before templating
- Do not pass raw plugin keys like `EDID`, `DNAM`, `VMAD`, etc., into templates
- Prefer semantic field names that reflect meaning in context
- If new mappings or relationships are discovered, update this rule with examples

*This rule is always in effect alongside the Project Logic, Template Construction, and Output Format rules.*

