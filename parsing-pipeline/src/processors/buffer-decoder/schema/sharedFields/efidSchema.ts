import { FieldSchema } from '../schemaTypes';
import { CTDA_ARRAY_SCHEMA } from './ctdaSchema';

/**
 * Comprehensive EFID (Effect) field schema based on UESP documentation
 *
 * EFID fields are used in SPEL and ENCH record types to define magic effects.
 * Each effect consists of EFID (effect ID) + EFIT (effect data) + optional CTDA (conditions).
 */

// EFIT field schema - 12 bytes total: magnitude (float32) + area (uint32) + duration (uint32)
const EFIT_SCHEMA: FieldSchema = {
  type: 'struct',
  size: 12,
  fields: [
    { name: 'magnitude', type: 'float32' },
    { name: 'area', type: 'uint32' },
    { name: 'duration', type: 'uint32' },
  ],
};

// Individual effect schema - EFID + EFIT + optional CTDA
const EFFECT_SCHEMA: Record<string, FieldSchema> = {
  // Effect ID - Magic Effect MGEF
  EFID: {
    type: 'formid',
  },
  // Effect data - 12 bytes: magnitude (float32) + area (uint32) + duration (uint32)
  EFIT: EFIT_SCHEMA,
  // Conditions for this effect (array of 0-n CTDA records)
  CTDA: CTDA_ARRAY_SCHEMA,
};

// Grouped effects schema for multiple effects
export const EFID_EFFECTS_SCHEMA: FieldSchema = {
  type: 'grouped',
  virtualField: 'effects', // Group will be assigned to this field
  cardinality: 'multiple',
  terminatorTag: 'EFID', // Stop when we hit the next effect's EFID
  groupSchema: EFFECT_SCHEMA,
};

/**
 * Utility functions for EFID field processing
 */

/**
 * Validates effect data
 */
export function validateEffectData(effectData: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!effectData) {
    return { isValid: false, errors: ['Effect data is null or undefined'] };
  }

  // Check required fields
  const requiredFields = ['EFID', 'EFIT'];
  for (const field of requiredFields) {
    if (effectData[field] === undefined) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  // Validate EFIT data
  if (effectData.EFIT) {
    const efit = effectData.EFIT;
    if (typeof efit.magnitude !== 'number') {
      errors.push('EFIT magnitude must be a number');
    }
    if (typeof efit.area !== 'number') {
      errors.push('EFIT area must be a number');
    }
    if (typeof efit.duration !== 'number') {
      errors.push('EFIT duration must be a number');
    }
  }

  // Validate EFID (should be a valid FormID)
  if (effectData.EFID && typeof effectData.EFID !== 'string') {
    errors.push('EFID must be a string FormID');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Generates a human-readable effect description
 */
export function generateEffectDescription(effectData: any): string {
  const { EFID, EFIT, CTDA } = effectData;

  if (!EFID || !EFIT) {
    return 'Invalid effect data';
  }

  const magnitude = EFIT.magnitude;
  const area = EFIT.area;
  const duration = EFIT.duration;

  let description = `Effect ${EFID}`;

  // Add magnitude info
  if (magnitude !== 0) {
    description += ` (Magnitude: ${magnitude}`;

    // Add area info
    if (area > 0) {
      description += `, Area: ${area}`;
    }

    // Add duration info
    if (duration > 0) {
      description += `, Duration: ${duration}`;
    }

    description += ')';
  }

  // Add condition info
  if (CTDA && CTDA.length > 0) {
    description += ` with ${CTDA.length} condition${CTDA.length > 1 ? 's' : ''}`;
  }

  return description;
}

/**
 * Calculates the total cost of an effect based on magnitude, area, and duration
 * This is a utility function that can be used for cost calculations
 */
export function calculateEffectCost(effectData: any): number {
  const { EFIT } = effectData;

  if (!EFIT) {
    return 0;
  }

  const { magnitude, area, duration } = EFIT;

  // Basic cost calculation (this is a simplified version)
  // Real cost calculation would be more complex and depend on the magic effect type
  let cost = Math.abs(magnitude) * 10;

  if (area > 0) {
    cost += area * 5;
  }

  if (duration > 0) {
    cost += duration * 2;
  }

  return Math.round(cost);
}

export { EFIT_SCHEMA, EFFECT_SCHEMA };
