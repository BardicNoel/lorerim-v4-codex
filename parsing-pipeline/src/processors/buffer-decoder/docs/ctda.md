# CTDA Field Primer

## Overview

**CTDA** (Condition) fields are widely used in Skyrim records to provide conditions that must be met. The format is similar to that used in Oblivion records, although there are more function indices.

In Skyrim.esm, the following record types have CTDA fields:

- ALCH, COBJ, CPTH, ENCH, FACT, IDLE, INFO, LSCR, MESG, MGEF, MUST, PACK, PERK, QUST, SCEN, SCRL, SMBN, SMQN, SNDR, SPEL

## Related Fields

CTDA fields are often accompanied by several related fields:

- **CITC** (uint32): Condition Item Count - sometimes used as a count of CTDA fields

  - Only certain specific cases make use of a CITC field
  - In those cases, CITC is required even if there are no CTDA fields (CITC = 0)
  - Seen in types: FACT, PACK, SMBN, SMQN, SMEN, MUST

- **CIS1** (zstring): Variable name that trails CTDA, replaces 1st argument in function call

  - Seen in types: IDLE, PACK, CPTH

- **CIS2** (zstring): Variable name that trails CTDA, replaces 2nd argument in function call
  - Seen in types: FACT, ENCH, SPEL, COBJ, QUST, IDLE, PACK, LSCR, PERK, SMBN, SMQN, SCEN, INFO

## Field Layout

The condition is assembled into a statement of the format:

```
<Reference>.<Function>(<Param1>, <Param2>) <Operator> <Value>
```

For example:

```
PlayerRef.GetDistance(MQ304AlduinHideInMistSouthMarker) > 6500
```

### Field Structure

| Name              | Type/Size    | Description                                                                               |
| ----------------- | ------------ | ----------------------------------------------------------------------------------------- |
| `operator`        | uint8        | Condition type where upper 3 bits contain compare operator and lower 5 bits contain flags |
| `unknown`         | uint8[3]     | Unused data                                                                               |
| `ComparisonValue` | formid/float | Value against which function result is compared, or GLOB formid if UseGlobal flag is set  |
| `FunctionIndex`   | uint16       | Function index (value from UESP minus 4096)                                               |
| `padding`         | uint8[2]     | Padding (may be non-zero but unused)                                                      |
| `param1`          | formID/int32 | First parameter (number or Form ID, zero if not needed)                                   |
| `param2`          | formID/int32 | Second parameter (number or Form ID, zero if not needed)                                  |
| `RunOnType`       | uint32       | How to apply the condition                                                                |
| `reference`       | formID       | Function reference (zero if no reference needed)                                          |
| `unknown`         | int32        | Index of package data or quest alias to run on (-1 means "none")                          |

### Operator Field Breakdown

#### Compare Operators (Upper 3 bits)

- `0` = Equal to
- `1` = Not equal to
- `2` = Greater than
- `3` = Greater than or equal to
- `4` = Less than
- `5` = Less than or equal to

#### Flags (Lower 5 bits)

- `0x01` = OR (default is to AND conditions together)
- `0x02` = Parameters (use aliases) - Force function parameters to use quest's reference alias
- `0x04` = Use global
- `0x08` = Use Pack Data - Force function parameters to use pack data
- `0x10` = Swap Subject and Target

### RunOnType Values

- `0` = Subject
- `1` = Target
- `2` = Reference
- `3` = Combat Target
- `4` = Linked Reference
- `5` = Quest Alias
- `6` = Package Data
- `7` = Event Data

## Special Case: GetEventData Function

For the GetEventData function, the parameter structure is different:

| Name     | Type/Size | Description                  |
| -------- | --------- | ---------------------------- |
| `param1` | uint16    | Event Function (enumeration) |
| `param2` | char[2]   | Event Member                 |
| `param3` | formID    | Third parameter              |

## Event Member Codes

Event member codes depend on the event type. Some examples:

- **Actor Dialogue Event**: L1 (Location), R1 (Actor 1), R2 (Actor 2)
- **Arrest Event**: R1 (ArrestingGuard), R2 (Criminal), L1 (Location), V1 (CrimeType)
- **Kill Actor Event**: R1 (Victim), R2 (Killer), L1 (Location), V1 (Crime Status), V2 (Relationship Rank)
- **Player Add Item**: R1 (OwnerRef), R2 (OriginalContainer), L1 (Location), F1 (ObjectForm), V1 (AcquireType)

## Parsing Considerations

### 1. Function Index Calculation

The FunctionIndex in the CTDA field is the UESP function index minus 4096.

### 2. String Parameters

When param1 or param2 are string types, there will be CIS1 or CIS2 subrecords following the CTDA with the actual string values.

### 3. Global References

When the UseGlobal flag (0x04) is set, the ComparisonValue field contains a GLOB formid instead of a float value.

### 4. Parameter Aliases

When the Parameters flag (0x02) is set, function parameters that usually use REFR forms will use a quest's reference alias instead.

### 5. Pack Data

When the Use Pack Data flag (0x08) is set, function parameters will use pack data instead of REFR forms.

## Implementation Guidelines

### 1. Flag Parsing

```typescript
const compareOperator = (operator >> 5) & 0x07; // Upper 3 bits
const flags = operator & 0x1f; // Lower 5 bits

const isOR = (flags & 0x01) !== 0;
const useAliases = (flags & 0x02) !== 0;
const useGlobal = (flags & 0x04) !== 0;
const usePackData = (flags & 0x08) !== 0;
const swapSubjectTarget = (flags & 0x10) !== 0;
```

### 2. Function Resolution

```typescript
const actualFunctionIndex = FunctionIndex + 4096;
// Look up function name from UESP function list using actualFunctionIndex
```

### 3. Parameter Handling

```typescript
// Check if parameters are strings (high values indicate string parameters)
const isParam1String = param1 > 0xffff;
const isParam2String = param2 > 0xffff;

// If string parameters, expect CIS1/CIS2 subrecords
if (isParam1String) {
  // Read CIS1 subrecord for param1 string
}
if (isParam2String) {
  // Read CIS2 subrecord for param2 string
}
```

### 4. Condition Statement Generation

```typescript
function generateConditionStatement(ctda: CTDAField): string {
  const operator = getOperatorString(ctda.operator);
  const functionName = getFunctionName(ctda.FunctionIndex);
  const params = formatParameters(ctda.param1, ctda.param2);
  const value = formatComparisonValue(ctda.ComparisonValue, ctda.useGlobal);

  return `${ctda.reference}.${functionName}(${params}) ${operator} ${value}`;
}
```

## References

- [UESP CTDA Field Documentation](https://en.uesp.net/wiki/Skyrim_Mod:Mod_File_Format/CTDA_Field)
- [Skyrim Function Indices](https://en.uesp.net/wiki/Skyrim_Mod:Function_Indices)
- [Oblivion Function Indices](https://en.uesp.net/wiki/Oblivion_Mod:Function_Indices)
