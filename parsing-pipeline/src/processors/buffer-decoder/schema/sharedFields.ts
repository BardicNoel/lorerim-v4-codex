import { SharedFields } from './schemaTypes';

// CTDA Operator constants
export const CTDA_COMPARE_OPERATORS = {
  0: 'Equal to',
  1: 'Not equal to',
  2: 'Greater than',
  3: 'Greater than or equal to',
  4: 'Less than',
  5: 'Less than or equal to',
} as const;

// CTDA Flag constants
export const CTDA_FLAGS = {
  0x01: 'OR',
  0x02: 'Use Aliases',
  0x04: 'Use Global',
  0x08: 'Use Pack Data',
  0x10: 'Swap Subject and Target',
} as const;

// CTDA RunOnType constants
export const CTDA_RUN_ON_TYPES = {
  0: 'Subject',
  1: 'Target',
  2: 'Reference',
  3: 'Combat Target',
  4: 'Linked Reference',
  5: 'Quest Alias',
  6: 'Package Data',
  7: 'Event Data',
} as const;

// CTDA parser functions
export const ctdaOperatorParser = (operator: number) => {
  const compareOperator = (operator >> 5) & 0x07;
  const flags = operator & 0x1f;

  return {
    compareOperator:
      CTDA_COMPARE_OPERATORS[compareOperator as keyof typeof CTDA_COMPARE_OPERATORS] ||
      `Unknown(${compareOperator})`,
    flags: Object.entries(CTDA_FLAGS)
      .filter(([bit]) => (flags & Number(bit)) !== 0)
      .map(([, label]) => label),
    rawOperator: operator,
    rawCompareOperator: compareOperator,
    rawFlags: flags,
  };
};

export const ctdaRunOnTypeParser = (value: number) => {
  return CTDA_RUN_ON_TYPES[value as keyof typeof CTDA_RUN_ON_TYPES] || `Unknown(${value})`;
};

// Shared internal field layouts that can be composed into larger structs
export const sharedFields: SharedFields = {
  flags8: [{ name: 'flags', type: 'uint8' }],
  flags32: [{ name: 'flags', type: 'uint32' }],

  // Comprehensive CTDA schema based on UESP documentation
  ctda: [
    { name: 'operator', type: 'uint8', parser: ctdaOperatorParser },
    { name: 'unknown', type: 'uint8' },
    { name: 'unknown2', type: 'uint8' },
    { name: 'unknown3', type: 'uint8' },
    { name: 'comparisonValue', type: 'float32' },
    { name: 'functionIndex', type: 'uint16' },
    { name: 'padding', type: 'uint8' },
    { name: 'padding2', type: 'uint8' },
    { name: 'param1', type: 'uint32' },
    { name: 'param2', type: 'uint32' },
    { name: 'runOnType', type: 'uint32', parser: ctdaRunOnTypeParser },
    { name: 'reference', type: 'formid' },
    { name: 'unknown4', type: 'int32' },
  ],

  // Legacy conditionBlock for backward compatibility
  conditionBlock: [
    { name: 'op', type: 'uint8' },
    { name: 'value', type: 'float32' },
    { name: 'functionIndex', type: 'uint32' },
    { name: 'param1', type: 'formid' },
    { name: 'param2', type: 'formid' },
    { name: 'runOnType', type: 'uint32' },
    { name: 'reference', type: 'formid' },
    { name: 'unknown', type: 'uint32' },
  ],

  // PERK-specific shared fields
  perkSectionHeader: [
    { name: 'sectionType', type: 'uint8' }, // 0=Quest, 1=Ability, 2=Complex Entry Point
    { name: 'rank', type: 'uint8' },
    { name: 'priority', type: 'uint8' },
  ],
  questData: [
    { name: 'questId', type: 'formid' },
    { name: 'stage', type: 'uint8' },
    { name: 'padding', type: 'uint8' },
    { name: 'padding2', type: 'uint8' },
    { name: 'padding3', type: 'uint8' },
  ],
  abilityData: [{ name: 'spellId', type: 'formid' }],
  complexData: [
    { name: 'effectType', type: 'uint8' },
    { name: 'functionType', type: 'uint8' },
    { name: 'conditionCount', type: 'uint8' },
  ],
};

// CTDA-related field schemas
export const CTDA_RELATED_FIELDS = {
  // CITC - Condition Item Count (sometimes accompanies CTDA)
  CITC: {
    name: 'conditionCount',
    type: 'uint32',
  },

  // CIS1 - Variable name for param1 (trails CTDA)
  CIS1: {
    name: 'param1String',
    type: 'string',
    encoding: 'utf8',
  },

  // CIS2 - Variable name for param2 (trails CTDA)
  CIS2: {
    name: 'param2String',
    type: 'string',
    encoding: 'utf8',
  },
};

export const CIS2Schema = {
  CIS2: {
    name: 'LocalizedStringID',
    type: 'uint32',
  },
};

const CONDITION_BLOCK_SCHEMA = {
  CIS2: {
    name: 'LocalizedStringID',
    type: 'uint32',
  },
};
