import { CTDA_FUNCTION_INDICES } from '@lorerim/platform-types';
import { FieldSchema } from '../schemaTypes';
import {
  CTDA_COMPARE_OPERATORS,
  CTDA_FLAGS,
  CTDA_RUN_ON_TYPES,
  ctdaOperatorParser,
  ctdaRunOnTypeParser,
} from '../sharedFields';

/**
 * Comprehensive CTDA (Condition) field schema based on UESP documentation
 *
 * CTDA fields are used in many Skyrim record types to provide conditions that must be met.
 * The field structure is complex with bit-packed operators and various parameter types.
 */

/**
 * Parser for CTDA function indices
 * Maps function index to function name and provides additional context
 */
function ctdaFunctionIndexParser(functionIndex: number): {
  functionName: string;
  functionIndex: number;
  description?: string;
  isSkillCheck?: boolean;
  skillName?: string;
} {
  const functionName = CTDA_FUNCTION_INDICES[functionIndex] || `UnknownFunction_${functionIndex}`;

  // Check if this is a skill check (ActorValue indices 6-23)
  const isSkillCheck = functionIndex >= 6 && functionIndex <= 23;

  let skillName: string | undefined;
  if (isSkillCheck) {
    const skillNames = [
      'OneHanded',
      'TwoHanded',
      'Marksman',
      'Block',
      'Smithing',
      'HeavyArmor',
      'LightArmor',
      'Pickpocket',
      'Lockpicking',
      'Sneak',
      'Alchemy',
      'Speechcraft',
      'Alteration',
      'Conjuration',
      'Destruction',
      'Illusion',
      'Restoration',
      'Enchanting',
    ];
    skillName = skillNames[functionIndex - 6];
  }

  // Build result object, only including defined properties
  const result: {
    functionName: string;
    functionIndex: number;
    description?: string;
    isSkillCheck?: boolean;
    skillName?: string;
  } = {
    functionName,
    functionIndex,
  };

  if (isSkillCheck) {
    result.isSkillCheck = true;
    result.description = `Check ${skillName} skill level`;
    if (skillName) {
      result.skillName = skillName;
    }
  } else {
    result.description = `Function index ${functionIndex}`;
  }

  return result;
}

// CTDA field schema - 32 bytes total
const CTDA_SCHEMA: FieldSchema = {
  type: 'struct',
  size: 32, // Fixed size for CTDA fields
  fields: [
    { name: 'operator', type: 'uint8', parser: ctdaOperatorParser },
    { name: 'unknown', type: 'uint8' },
    { name: 'unknown2', type: 'uint8' },
    { name: 'unknown3', type: 'uint8' },
    { name: 'comparisonValue', type: 'float32' },
    { name: 'function', type: 'uint16', parser: ctdaFunctionIndexParser },
    { name: 'padding', type: 'uint8' },
    { name: 'padding2', type: 'uint8' },
    { name: 'param1', type: 'uint32' },
    { name: 'param2', type: 'uint32' },
    { name: 'runOnType', type: 'uint32', parser: ctdaRunOnTypeParser },
    { name: 'reference', type: 'formid' },
    { name: 'unknown4', type: 'int32' },
  ],
};

// CTDA array schema for multiple conditions
export const CTDA_ARRAY_SCHEMA: FieldSchema = {
  type: 'array',
  element: CTDA_SCHEMA,
};

// Related CTDA fields that may follow CTDA records
export const CTDA_RELATED_SCHEMAS: Record<string, FieldSchema> = {
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

/**
 * Utility functions for CTDA field processing
 */

/**
 * Determines if a parameter value indicates a string parameter
 * String parameters have high values (> 0xFFFF) and require CIS1/CIS2 subrecords
 */
export function isStringParameter(paramValue: number): boolean {
  return paramValue > 0xffff;
}

/**
 * Determines if ComparisonValue should be treated as a GLOB formid
 * This happens when the UseGlobal flag (0x04) is set
 */
export function isGlobalComparison(operator: number): boolean {
  const flags = operator & 0x1f;
  return (flags & 0x04) !== 0;
}

/**
 * Generates a human-readable condition statement
 */
export function generateConditionStatement(ctdaData: any): string {
  const {
    operator,
    comparisonValue,
    function: functionData,
    param1,
    param2,
    runOnType,
    reference,
  } = ctdaData;

  // Parse operator
  const operatorData = typeof operator === 'object' ? operator : ctdaOperatorParser(operator);
  const compareOp = operatorData.compareOperator;

  // Get function info using the new parser
  const functionInfo =
    typeof functionData === 'object' ? functionData : ctdaFunctionIndexParser(functionData);
  const functionName = functionInfo.functionName;

  // Format parameters
  const params = [];
  if (param1 !== 0) {
    params.push(isStringParameter(param1) ? `"${param1}"` : param1.toString());
  }
  if (param2 !== 0) {
    params.push(isStringParameter(param2) ? `"${param2}"` : param2.toString());
  }
  const paramString = params.join(', ');

  // Format comparison value
  const valueString = isGlobalComparison(operator)
    ? `GLOB_${comparisonValue.toString(16).padStart(8, '0').toUpperCase()}`
    : comparisonValue.toString();

  // Format reference
  const refString =
    reference !== 0 ? `REF_${reference.toString(16).padStart(8, '0').toUpperCase()}` : 'PlayerRef';

  // Create human-readable condition
  if (functionInfo.isSkillCheck && functionInfo.skillName) {
    return `${functionInfo.skillName} ${compareOp} ${valueString}`;
  }

  return `${refString}.${functionName}(${paramString}) ${compareOp} ${valueString}`;
}

/**
 * Validates CTDA field data
 */
export function validateCTDAField(ctdaData: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!ctdaData) {
    return { isValid: false, errors: ['CTDA data is null or undefined'] };
  }

  // Check required fields
  const requiredFields = [
    'operator',
    'comparisonValue',
    'functionIndex',
    'param1',
    'param2',
    'runOnType',
    'reference',
  ];
  for (const field of requiredFields) {
    if (ctdaData[field] === undefined) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  // Validate operator
  if (ctdaData.operator !== undefined) {
    const operatorData =
      typeof ctdaData.operator === 'object'
        ? ctdaData.operator
        : ctdaOperatorParser(ctdaData.operator);
    if (!operatorData.compareOperator || operatorData.compareOperator.startsWith('Unknown')) {
      errors.push(`Invalid compare operator: ${operatorData.rawCompareOperator}`);
    }
  }

  // Validate runOnType
  if (ctdaData.runOnType !== undefined) {
    const runOnType =
      typeof ctdaData.runOnType === 'string'
        ? ctdaData.runOnType
        : ctdaRunOnTypeParser(ctdaData.runOnType);
    if (runOnType.startsWith('Unknown')) {
      errors.push(`Invalid runOnType: ${ctdaData.runOnType}`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Schema for a complete CTDA condition block with related fields
 * This can be used in grouped fields or as a standalone schema
 */
export const CTDA_CONDITION_BLOCK_SCHEMA: Record<string, FieldSchema> = {
  CTDA: CTDA_SCHEMA,
  CITC: CTDA_RELATED_SCHEMAS.CITC,
  CIS1: CTDA_RELATED_SCHEMAS.CIS1,
  CIS2: CTDA_RELATED_SCHEMAS.CIS2,
};

export {
  CTDA_COMPARE_OPERATORS,
  CTDA_FLAGS,
  CTDA_RUN_ON_TYPES,
  CTDA_FUNCTION_INDICES,
  ctdaOperatorParser,
  ctdaRunOnTypeParser,
  ctdaFunctionIndexParser,
};
