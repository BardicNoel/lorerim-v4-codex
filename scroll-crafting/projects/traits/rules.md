# RuleSet: Traits Generator

## Inherit Rules
- code_quality
- generator_structure
- project_logic
- data_mapping
- schema_linker
- template_construction
- output_format
- testing
- cursor_agent_behavior

## Project Directories
- records/: Source records for trait definitions and related data
- templates/: Primary and partial Markdown templates for trait documentation
- logic/: Domain-specific trait interpretation and enrichment
- output/: Generated JSON and Markdown files
- __tests__/: Test suites for trait logic and generation

## Record Types
Required record types for trait processing:
- Primary records in project/records/:
  - PERK: Core trait definitions and effects
  - SPEL: Spell effects associated with traits
  - MGEF: Magic effect descriptions
- Fallback records in primaries/:
  - KYWD: Keyword categorization
  - GLOB: Global values
  - AVIF: Actor values

## Output Requirements
- JSON Output:
  - Must follow TraitOutput interface
  - Include all trait metadata
  - Preserve relationships between traits
  - Include categorization
- Markdown Output:
  - Clear hierarchical structure
  - Trait grouping by category
  - Complete effect descriptions
  - Prerequisites and requirements

## Cursor Agent Instructions
- Follow all inherited rules as written
- Never mutate files outside this project folder
- Use utilities from `utils/` for record resolution
- Output must match the conceptual structure defined in traits-implementation-rule
- Write tests in `__tests__/` for all logic modules
- Update implementation status matrix when completing components

## Special Notes
- Traits may have complex relationships with other game systems
- Effect descriptions should be clear and gameplay-focused
- Categories must be consistently applied
- Consider compatibility with web and GPT consumption
- Maintain clear separation between raw data and presentation 