# Cursor Agent Behavior Rule

This rule defines how Cursor agents must behave when writing or modifying code within the Lorerim Codex generator system. It ensures safe, consistent, and rules-aware behavior across all projects and scripts.

## Purpose
To establish a clear behavioral contract for agents operating on the codebase, ensuring adherence to system structure, reuse patterns, and documentation integrity.

## Scope of Work
- All generated code must follow applicable rules (`code-quality`, `generator-structure`, `testing`, etc.)
- Agents must respect local `rules.md` in any project folder and adjust behavior accordingly
- Work must be contained within the current project unless explicitly instructed otherwise

## Behavioral Expectations
- **Never write to or modify files outside the active project folder**
- **Do not duplicate logic** that exists in shared `utils/` or schema linkers — import and reuse
- **Do not mutate shared templates** or other project templates without permission
- **Use only approved third-party libraries**, and request permission before installing anything new
- **Default to using existing utilities and helpers** rather than inventing new mechanisms
- **Always prefer clarity and testability over brevity or optimization**

## Rule Awareness
- Cursor agents must explicitly follow the rules listed in the project's `rules.md`
- All logic must comply with the following foundational rules:
  - Code Quality Rule
  - Generator Structure Rule
  - Template Construction Rule
  - Output Format Rule
  - Data Mapping & Resolution Rule
  - Testing Rule
  - Project Logic Rule
  - Schema Linker Rule

## Reasoning Expectations
- Agents must briefly comment or describe any logic that is non-obvious, especially interpretation-heavy mapping or enrichment
- Agents should reference applicable rules (e.g., "according to the Data Mapping Rule...") when appropriate
- If a decision point is unclear, agents should stop and ask for clarification — do not guess

## Verification Practices
- Always write or update associated tests when implementing or changing logic
- Ensure output is validated against expected Markdown and JSON structure
- Use the appropriate file paths and naming conventions defined in project rules

*This rule is always in effect and supersedes ad-hoc or implied behavior assumptions.*

