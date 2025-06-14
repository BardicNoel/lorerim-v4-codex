/**
 * Constants for buffer operations in Skyrim plugin files
 */

// Record header structure sizes
export const RECORD_HEADER = {
  SIGNATURE_SIZE: 4,    // Record type (e.g., 'GRUP', 'RACE')
  DATA_SIZE: 4,         // Size of record data
  FLAGS_SIZE: 4,        // Record flags
  FORM_ID_SIZE: 4,      // Form ID
  VERSION_SIZE: 1,      // Version control info
  UNKNOWN_SIZE: 1,      // Unknown/Reserved
  TOTAL_SIZE: 24,       // Total header size
  OFFSETS: {
    TYPE: 0,
    SIZE: 4,
    FLAGS: 8,
    FORM_ID: 12,
    VERSION: 16,
    UNKNOWN: 17
  }
} as const;

// Subrecord header structure sizes
export const SUBRECORD_HEADER = {
  SIGNATURE_SIZE: 4,    // Subrecord type
  SIZE_SIZE: 2,         // Size of subrecord data
  TOTAL_SIZE: 6         // Total header size
} as const;

// GRUP header structure sizes
export const GRUP_HEADER = {
  SIGNATURE_SIZE: 4,    // Always 'GRUP'
  SIZE_SIZE: 4,         // Size of GRUP data
  LABEL_SIZE: 4,        // Record type for type 0 GRUPs
  GROUP_TYPE_SIZE: 4,   // GRUP type
  TIMESTAMP_SIZE: 4,    // Timestamp
  VERSION_SIZE: 4,      // Version control info
  TOTAL_SIZE: 24        // Total header size
} as const;

// Common buffer operation sizes
export const BUFFER = {
  RECORD_TYPE_SIZE: 4,  // Size of record type string
  INITIAL_DATA_DUMP: 64, // Number of bytes to dump for initial data preview
  MAX_LOOKAHEAD: 64
} as const;

// Offsets within headers
export const OFFSETS = {
  RECORD: {
    SIGNATURE: 0,
    DATA_SIZE: RECORD_HEADER.SIGNATURE_SIZE,
    FLAGS: RECORD_HEADER.SIGNATURE_SIZE + RECORD_HEADER.DATA_SIZE,
    FORM_ID: RECORD_HEADER.SIGNATURE_SIZE + RECORD_HEADER.DATA_SIZE + RECORD_HEADER.FLAGS_SIZE,
    VERSION: RECORD_HEADER.SIGNATURE_SIZE + RECORD_HEADER.DATA_SIZE + RECORD_HEADER.FLAGS_SIZE + RECORD_HEADER.FORM_ID_SIZE,
    UNKNOWN: RECORD_HEADER.SIGNATURE_SIZE + RECORD_HEADER.DATA_SIZE + RECORD_HEADER.FLAGS_SIZE + RECORD_HEADER.FORM_ID_SIZE + RECORD_HEADER.VERSION_SIZE
  },
  SUBRECORD: {
    SIGNATURE: 0,
    SIZE: SUBRECORD_HEADER.SIGNATURE_SIZE
  },
  GRUP: {
    SIGNATURE: 0,
    SIZE: GRUP_HEADER.SIGNATURE_SIZE,
    LABEL: GRUP_HEADER.SIGNATURE_SIZE + GRUP_HEADER.SIZE_SIZE,
    GROUP_TYPE: GRUP_HEADER.SIGNATURE_SIZE + GRUP_HEADER.SIZE_SIZE + GRUP_HEADER.LABEL_SIZE,
    TIMESTAMP: GRUP_HEADER.SIGNATURE_SIZE + GRUP_HEADER.SIZE_SIZE + GRUP_HEADER.LABEL_SIZE + GRUP_HEADER.GROUP_TYPE_SIZE,
    VERSION: GRUP_HEADER.SIGNATURE_SIZE + GRUP_HEADER.SIZE_SIZE + GRUP_HEADER.LABEL_SIZE + GRUP_HEADER.GROUP_TYPE_SIZE + GRUP_HEADER.TIMESTAMP_SIZE
  }
} as const; 