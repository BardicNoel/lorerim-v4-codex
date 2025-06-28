# Enchanted Weapons Project Rules

This project follows the established Lorerim Codex patterns and inherits from the base rules while implementing domain-specific requirements for enchanted weapons documentation.

## Inherited Rules

This project follows all base rules:

- Code Quality Rule
- Generator Structure Rule
- Template Construction Rule
- Output Format Rule
- Data Mapping & Resolution Rule
- Testing Rule
- Project Logic Rule
- Schema Linker Rule

## Project-Specific Requirements

### Data Relationships

- **WEAP.EITM** → **ENCH** (weapon enchantment reference)
- **ENCH.EFID** → **MGEF** (enchantment effect reference)
- **WEAP.DNAM.animationType** → weapon category mapping

### Required Record Types

- **WEAP** (Weapon records) - Base weapon data and enchantment references
- **ENCH** (Enchantment records) - Enchantment data and effect references
- **MGEF** (Magic Effect records) - Effect details and descriptions

### Output Format

- **JSON**: Machine-readable structured data for web/GPT systems
- **Markdown**: Human-readable documentation organized by weapon categories

### Validation Requirements

- All WEAP records with EITM must be processed
- All ENCH records must be properly resolved
- All MGEF records must be properly resolved
- Weapon categorization must be accurate
- Enchantment costs must be calculated correctly

### Error Handling

- Graceful handling of missing ENCH records
- Graceful handling of missing MGEF records
- Logging of unresolved references
- Validation of required fields

## Project Structure Compliance

This project maintains the required structure:

- `generate.ts` - Main generator script
- `logic/resolveEnchantedWeapons.ts` - Domain-specific processing
- `templates/` - Handlebars templates
- `__tests__/` - Comprehensive test coverage
- `output/` - Generated files (created by script)

## Quality Standards

- TypeScript with strict typing
- Functional programming practices
- Comprehensive error handling
- Full test coverage
- Clear documentation
- Consistent code style
