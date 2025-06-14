# Pipeline Templates

The pipeline system uses YAML templates to create reusable configurations for processing different types of records. This document explains how to use and create pipeline templates.

## Overview

The template system allows you to:
- Define common processing stages that can be reused across different record types
- Keep record-specific configurations separate and maintainable
- Ensure consistent processing across different record types
- Easily create new pipelines for different record types
- Use individual common stages as needed

## Directory Structure

```
parsing-pipeline/
├── config/
│   ├── templates/
│   │   └── base-pipeline.yaml    # Base template with common stages
│   └── pipelines/
│       ├── mgef-analysis.yaml    # MGEF-specific pipeline
│       └── weap-analysis.yaml    # WEAP-specific pipeline
└── docs/
    └── pipeline-templates.md     # This documentation
```

## Base Template

The base template (`base-pipeline.yaml`) contains common stages that are used across all record types. It defines:

1. Individual stages under the `stages` section:
   - `filter_winners`: Filter winning records
   - `remove_null_refs`: Remove null references
   - `extract_form_ids`: Extract form IDs from reference strings

2. Common exclude fields that can be reused in different stages

Example:
```yaml
name: "${pipelineName}"
description: "${pipelineDescription}"
input: "${inputPath}"
output: "${outputPath}"

# Common exclude fields that can be reused
common_exclude_fields:
  - "plugin"
  - "load_order"
  - "form_id"
  - "full_form_id"
  - "unique_id"
  - "record_type"
  - "editor_id"
  - "winning"

# Stage definitions that can be referenced
stages:
  filter_winners:
    name: "Filter Winning Records"
    type: "filter-records"
    description: "Keep only winning records"
    criteria:
      - field: "winning"
        operator: "equals"
        value: true

  remove_null_refs:
    name: "Remove Null References"
    type: "sanitize-fields"
    description: "Remove null reference strings"
    rules:
      - pattern: "NULL - Null Reference"
        action: "remove"
        excludeFields:
          - "plugin"
          - "form_id"
          - "editor_id"
```

## Using Individual Stages

You can use individual common stages in your pipeline configuration. This is useful when you:
- Want to change the order of stages
- Only need specific common stages
- Want to insert custom stages between common stages

Example:
```yaml
name: "Custom Pipeline"
description: "Pipeline with custom stage order"
input: "../data/raw/Export_CUSTOM.json"
output: "../data/processed/CUSTOM.analysis.json"

stages:
  # Use individual stages in custom order
  - from: "ref"
    file: "config/templates/base-pipeline.yaml"
    ref: "filter_winners"
  - from: "ref"
    file: "config/templates/base-pipeline.yaml"
    ref: "extract_form_ids"
  - from: "local"
    name: "Custom Stage"
    type: "remove-fields"
    description: "Custom field removal"
    fields:
      data:
        "Custom Data": "all"
  - from: "ref"
    file: "config/templates/base-pipeline.yaml"
    ref: "remove_null_refs"
```

## Creating a New Pipeline

To create a new pipeline for a different record type:

1. Create a new YAML file in `config/pipelines/`
2. Reference stages from the base template using the `from: "ref"` syntax
3. Add record-specific stages using `from: "local"`
4. Order stages as needed for your pipeline

Example for a WEAP pipeline:
```yaml
name: "WEAP Analysis Pipeline"
description: "Process WEAP records for analysis"
input: "../data/raw/Export_WEAP.json"
output: "../data/processed/WEAP.analysis.json"

stages:
  # Use individual stages
  - from: "ref"
    file: "config/templates/base-pipeline.yaml"
    ref: "filter_winners"
  - from: "ref"
    file: "config/templates/base-pipeline.yaml"
    ref: "remove_null_refs"

  # Add WEAP-specific stage
  - from: "local"
    name: "Remove WEAP Specific Fields"
    type: "remove-fields"
    description: "Remove WEAP-specific fields that are not needed for analysis"
    fields:
      data:
        "Weapon Data":
          "DATA - Data":
            - "Weight"
            - "Value"
            - "Damage"
            - "Clip Rounds"
        "VATS - VATS Data": "all"

  # Add form ID extraction after field removal
  - from: "ref"
    file: "config/templates/base-pipeline.yaml"
    ref: "extract_form_ids"
```

## Important Notes

1. **Path Resolution**
   - All paths in pipeline configurations are relative to the `parsing-pipeline` directory
   - This includes both input/output paths and template file references
   - Example: `"../data/raw/Export_MGEF.json"` is relative to `parsing-pipeline/`

2. **Stage References**
   - Use `from: "ref"` to reference stages from templates
   - Use `from: "local"` for pipeline-specific stages
   - Stage references use the stage name directly (e.g., `ref: "filter_winners"`)
   - Template file paths are relative to `parsing-pipeline/` (e.g., `"config/templates/base-pipeline.yaml"`)

3. **Stage Types**
   - `filter-records`: Filter records based on criteria
   - `remove-fields`: Remove specific fields from records
   - `keep-fields`: Keep only specified fields
   - `sanitize-fields`: Clean and validate field values

## Best Practices

1. **Template Usage**
   - Always reference stages from the base template when possible
   - Use `from: "local"` only for record-specific stages
   - Consider stage order when combining template and local stages
   - Document any record-specific requirements

2. **Field Removal**
   - Be specific about which fields to remove
   - Use `"all"` sparingly and only when appropriate
   - Document why fields are being removed

3. **Naming Conventions**
   - Use clear, descriptive names for pipelines
   - Include record type in pipeline name
   - Use consistent naming for stages

4. **Documentation**
   - Add descriptions to all stages
   - Document any record-specific requirements
   - Keep this documentation updated

## Example Pipelines

### MGEF Pipeline (Using All Common Stages)
```yaml
name: "MGEF Analysis Pipeline"
description: "Process MGEF records for analysis"
input: "../data/raw/Export_MGEF.json"
output: "../data/processed/MGEF.analysis.json"

imports:
  - "../templates/base-pipeline.yaml"

stages:
  *common_stages

  - name: "Decode MGEF Binary Data"
    type: "buffer-decoder"
    description: "Decode binary record data into structured format"
    recordType: "MGEF"

  - name: "Remove MGEF Specific Fields"
    type: "remove-fields"
    description: "Remove MGEF-specific fields that are not needed for analysis"
    fields:
      data:
        "Magic Effect Data":
          "DATA - Data":
            - "Explosion"
            - "Projectile"
            - "Taper Weight"
            - "Hit Shader"
            - "Enchant Shader"
            - "Taper Curve"
            - "Taper Duration"
            - "Second AV Weight"
        "SNDD - Sounds": "all"
```

### WEAP Pipeline (Using Individual Stages)
```yaml
name: "WEAP Analysis Pipeline"
description: "Process WEAP records for analysis"
input: "../data/raw/Export_WEAP.json"
output: "../data/processed/WEAP.analysis.json"

imports:
  - "../templates/base-pipeline.yaml"

stages:
  - *filter_winners
  - *remove_null_refs

  - name: "Remove WEAP Specific Fields"
    type: "remove-fields"
    description: "Remove WEAP-specific fields that are not needed for analysis"
    fields:
      data:
        "Weapon Data":
          "DATA - Data":
            - "Weight"
            - "Value"
            - "Damage"
            - "Clip Rounds"
        "VATS - VATS Data": "all"

  - *extract_form_ids
```

## Troubleshooting

1. **Import Issues**
   - Ensure the path to the base template is correct
   - Check that the base template exists
   - Verify YAML syntax in both files

2. **Stage Order**
   - Common stages should come before record-specific stages
   - Check that stages are properly indented
   - Verify that YAML anchors are properly referenced
   - When using individual stages, ensure correct order

3. **Field Removal**
   - Verify field paths are correct
   - Check that fields exist in the input data
   - Ensure no critical fields are accidentally removed

## Contributing

When adding new features to the template system:

1. Update the base template if the feature is common
2. Document new stages and their purpose
3. Add examples of usage
4. Update this documentation

## Future Improvements

Potential improvements to the template system:

1. Support for multiple template imports
2. Conditional stage execution
3. More sophisticated field removal patterns
4. Validation of pipeline configurations
5. Support for custom stage types
6. Stage dependencies and ordering constraints 