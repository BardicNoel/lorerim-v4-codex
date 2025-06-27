List => Perk => Spel => MGEF

Perks will have conditions that check "hasPerk" for prereqs, this is how we build the tree.

# Destiny Perk Logic

## Overview

Destiny Perk trees are built by extracting the relevant FLST record from the plugin `SubclassesOfSkyrim.esp` (specifically, the `DAR_DestinyFormList`).

- The FLST's `LNAM` array provides a list of FormIDs, each referencing a Destiny Perk that represents a subclass root.
- For each FormID in `LNAM`, use the `findByFormId` utility to look up the corresponding Destiny Perk record in the parsed perks dataset (`perks.json`).
- All field access and mapping must follow the [Data Mapping Rule](../../.cursor/rules/data_mapping_rule.mdc): always use the `decodedData` field, and resolve cross-record references using `findByFormId`.
- Destiny Perk conditions (such as `hasPerk`) define the tree structure and prerequisites for subclasses.

## Process Outline

1. **Extract FLST Record**: Locate the FLST record with `EDID` = `DAR_DestinyFormList` and `plugin` = `SubclassesOfSkyrim.esp`.
2. **Resolve Destiny Perks**: For each FormID in the FLST's `LNAM`, use `findByFormId` to get the corresponding Destiny Perk record.
3. **Map Destiny Perk Data**: Use the data mapping rule to transform Destiny Perk data into a clean, semantic structure (e.g., name, description, prerequisites).
4. **Build Destiny Perk Tree**: Use Destiny Perk conditions to establish prerequisites and relationships.

## Output Guidelines

- The global Destiny Perk tree should be rendered as a **Mermaid diagram** at the top of the Markdown output. This diagram will visually represent all relationships, including converging paths.
- Each Destiny Perk section should list only its **immediate prerequisites** (direct dependencies), not full paths or breadcrumbs.

This logic ensures all Destiny Perk data is cleanly mapped, cross-referenced, and ready for output or further processing.
