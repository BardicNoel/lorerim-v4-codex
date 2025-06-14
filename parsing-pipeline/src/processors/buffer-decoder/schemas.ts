import { RecordSchema, SharedFields, RecordSpecificSchemas } from './types';

// Common field schemas that are reused across record types
export const commonFieldSchemas: RecordSchema = {
  EDID: { type: 'string', encoding: 'utf8' },
  FULL: { type: 'string', encoding: 'utf16le' },
  DESC: { type: 'string', encoding: 'utf16le' },
  ICON: { type: 'string', encoding: 'utf8' } // Used in many visual records
  
};

// Shared internal field layouts that can be composed into larger structs
export const sharedFields: SharedFields = {
  flags8: [{ name: 'flags', type: 'uint8' }],
  flags32: [{ name: 'flags', type: 'uint32' }],
  conditionBlock: [
    { name: 'op', type: 'uint8' },
    { name: 'value', type: 'float32' },
    { name: 'functionIndex', type: 'uint32' }
  ]
};

// Record-specific schemas that use common fields and shared fragments
export const recordSpecificSchemas: RecordSpecificSchemas = {
  PERK: {
      // Main DATA block with perk flags and rank info
      DATA: {
        type: 'struct',
        fields: [
          { name: 'isTrait',       type: 'uint8' },
          { name: 'level',         type: 'uint8' },
          { name: 'numRanks',      type: 'uint8' },
          { name: 'isPlayable',    type: 'uint8' },
          { name: 'isHidden',      type: 'uint8' }
        ]
      },
  
      // If present, points to the next perk in the chain
      NNAM: { type: 'formid' },
  
      // Conditions gating perk availability
      CTDA: {
        type: 'array',
        element: {
          type: 'struct',
          fields: sharedFields.conditionBlock
        }
      },
  
      // Each perk section: Quest (0), Ability (1), or Complex Entry Point (2)
      PRKE: {
        type: 'struct',
        fields: [
          { name: 'sectionType', type: 'uint8' },  // 0,1,2
          { name: 'rank',        type: 'uint8' },
          { name: 'priority',    type: 'uint8' }
        ]
      },
  
      // Data specific to each section type — initially raw bytes
      PRKD: { type: 'unknown' }, // Structure depends on PRKE.sectionType
  
      // Complex-entry points: condition type logic
      PRKC: {
        type: 'struct',
        fields: [
          { name: 'condType', type: 'uint8' }
        ]
      },
  
      // Entry-point effects, interpreted dynamically
      EPFT: { type: 'uint8' }, // Effect data type code
      EPFD: { type: 'unknown' }, // Payload (float/formid/string depending on EPFT)
      EPF2: { type: 'unknown' }, // Extra data for certain EPFTs
      EPF3: { type: 'uint32' },  // Additional int32 if EPFT=04/05
  
      // Section terminator — marks end of section
      PRKF: { type: 'unknown' }

  },
  CELL: {
    DATA: {
      type: 'struct',
      fields: [
        ...sharedFields.flags32,
        { name: 'lightLevel', type: 'uint8' }
      ]
    }
  },
  SPEL: {
    // Casting cost and time (COST subrecord)
    COST: {
      type: 'struct',
      fields: [
        { name: 'castingCost', type: 'uint32' },
        { name: 'castingTime', type: 'float32' },
        { name: 'chargeTime', type: 'float32' },
      ],
    },
    // Projectile (SPIT)
    SPIT: {
      type: 'struct',
      fields: [
        { name: 'projectileFormID', type: 'formid' },
      ],
    },
    // Flags (spell properties like 'Hostile', 'No-Absorb')
    SKIL: { type: 'struct', fields: sharedFields.flags32 },
    // Spell effects
    EFIT: {
      type: 'array',
      element: {
        type: 'struct',
        fields: [
          { name: 'magicEffect', type: 'formid' },
          { name: 'skillOrAttribute', type: 'uint32' },
          { name: 'area', type: 'float32' },
          { name: 'duration', type: 'float32' },
          { name: 'magnitudeMin', type: 'float32' },
          { name: 'magnitudeMax', type: 'float32' },
        ],
      },
    },
    // Conditions attached to spell
    CTDA: {
      type: 'array',
      element: {
        type: 'struct',
        fields: sharedFields.conditionBlock,
      },
    },
  },
  ALCH: {
    OBND: { type: 'unknown' },
    KSIZ: { type: 'uint32' },
    KWDA: { type: 'unknown' },
    MODL: { type: 'unknown' },
    ICON: { type: 'string', encoding: 'utf8' },
    MICO: { type: 'string', encoding: 'utf8' },
    YNAM: { type: 'formid' },
    ZNAM: { type: 'formid' },
    DATA: { type: 'float32' },
    ENIT: { type: 'struct', fields: [
      { name: 'value', type: 'uint32' },
      { name: 'flags', type: 'uint32' },
      { name: 'addiction', type: 'formid' },
      { name: 'addictionChance', type: 'uint32' },
      { name: 'useSound', type: 'formid' }
    ] },
    EFID: { type: 'formid' },
    EFIT: { type: 'struct', fields: [
      { name: 'magnitude', type: 'float32' },
      { name: 'area', type: 'uint32' },
      { name: 'duration', type: 'uint32' }
    ] },
  },
  MGEF: {
    DATA: {
      type: 'struct',
      fields: [
        { name: 'effectType', type: 'uint32' },
        { name: 'baseCost', type: 'float32' },
        { name: 'flags', type: 'uint32' },
        { name: 'targetType', type: 'uint32' },
        { name: 'castingLight', type: 'formid' },
        { name: 'projectileSpeed', type: 'float32' },
        { name: 'effectShader', type: 'formid' },
        { name: 'enchantShader', type: 'formid' },
        { name: 'castingSound', type: 'formid' },
        { name: 'boltSound', type: 'formid' },
        { name: 'hitSound', type: 'formid' },
        { name: 'areaSound', type: 'formid' },
        { name: 'boltSoundLoop', type: 'formid' },
        { name: 'hitShader', type: 'formid' },
        { name: 'castingArt', type: 'formid' },
        { name: 'boltArt', type: 'formid' },
        { name: 'hitArt', type: 'formid' },
        { name: 'enchantArt', type: 'formid' },
        { name: 'enchantSound', type: 'formid' },
        { name: 'impactDataSet', type: 'formid' },
        { name: 'school', type: 'uint32' },
        { name: 'resistValue', type: 'uint32' },
        { name: 'actorValue', type: 'formid' },
        { name: 'rangeMin', type: 'float32' },
        { name: 'rangeMax', type: 'float32' },
        { name: 'durationMin', type: 'float32' },
        { name: 'durationMax', type: 'float32' },
        { name: 'magnitudeMin', type: 'float32' },
        { name: 'magnitudeMax', type: 'float32' }
      ]
    }
  }
}; 