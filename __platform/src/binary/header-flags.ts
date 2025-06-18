// skyrimRecordFlags.ts
// Parses a Skyrim plugin record header buffer and extracts flag states

export const FLAGS = {
    DELETED:    0x00000001,
    PERSISTENT: 0x00000002,
    DISABLED:   0x00000004,
    IGNORED:    0x00000008,
    DISTANT:    0x00000040,
    DANGEROUS:  0x00000200,
    OBSOLETE_COMPRESSED: 0x00000400,
    COMPRESSED: 0x00040000
  } as const;
  
  export interface RecordFlagResult {
    rawFlags: number;
    isDeleted: boolean;
    isPersistent: boolean;
    isDisabled: boolean;
    isIgnored: boolean;
    isDistantLOD: boolean;
    isDangerous: boolean;
    isObsoleteCompressed: boolean;
    isCompressed: boolean;
  }
  
  /**
   * Parses a record header and returns flag information
   * @param buffer - Buffer starting at the record header
   * @returns Parsed flag states
   */
  export function parseRecordFlags(buffer: Buffer): RecordFlagResult {
    if (!Buffer.isBuffer(buffer) || buffer.length < 0x10) {
      throw new Error("Buffer must be at least 16 bytes and a valid Buffer object.");
    }
  
    const flags = buffer.readUInt32LE(0x0C);
  
    return {
      rawFlags: flags,
      isDeleted:     (flags & FLAGS.DELETED) !== 0,
      isPersistent:  (flags & FLAGS.PERSISTENT) !== 0,
      isDisabled:    (flags & FLAGS.DISABLED) !== 0,
      isIgnored:     (flags & FLAGS.IGNORED) !== 0,
      isDistantLOD:  (flags & FLAGS.DISTANT) !== 0,
      isDangerous:   (flags & FLAGS.DANGEROUS) !== 0,
      isObsoleteCompressed: (flags & FLAGS.OBSOLETE_COMPRESSED) !== 0,
      isCompressed:  (flags & FLAGS.COMPRESSED) !== 0
    };
  }
  