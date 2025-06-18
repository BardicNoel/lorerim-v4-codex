import { decompressRecordData, autoDecompressRecordData, isRecordCompressed } from '../record-decompressor';
import { FLAGS } from '../header-flags';

describe('Record Decompressor', () => {
  describe('isRecordCompressed', () => {
    it('should detect compressed records correctly', () => {
      // Create a mock buffer with compressed flag set
      const buffer = Buffer.alloc(0x20);
      buffer.writeUInt32LE(FLAGS.COMPRESSED, 0x0C); // Set compressed flag
      
      expect(isRecordCompressed(buffer)).toBe(true);
    });

    it('should detect uncompressed records correctly', () => {
      // Create a mock buffer without compressed flag
      const buffer = Buffer.alloc(0x20);
      buffer.writeUInt32LE(0, 0x0C); // No flags set
      
      expect(isRecordCompressed(buffer)).toBe(false);
    });

    it('should handle invalid buffers gracefully', () => {
      expect(isRecordCompressed(Buffer.alloc(0x10))).toBe(false);
    });
  });

  describe('decompressRecordData', () => {
    it('should handle uncompressed data correctly', () => {
      const testData = Buffer.from('Hello World');
      const buffer = Buffer.alloc(0x18 + testData.length);
      testData.copy(buffer, 0x18);
      
      const result = decompressRecordData(buffer, testData.length, false);
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(testData);
      expect(result.originalSize).toBe(testData.length);
      expect(result.decompressedSize).toBe(testData.length);
    });

    it('should auto-detect compression when not specified', () => {
      const testData = Buffer.from('Hello World');
      const buffer = Buffer.alloc(0x18 + testData.length);
      testData.copy(buffer, 0x18);
      buffer.writeUInt32LE(FLAGS.COMPRESSED, 0x0C); // Set compressed flag
      
      const result = decompressRecordData(buffer, testData.length);
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(testData);
    });

    it('should handle invalid buffer input', () => {
      const result = decompressRecordData(null as any, 10);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Input must be a valid Buffer');
    });

    it('should handle invalid data size', () => {
      const buffer = Buffer.alloc(0x20);
      const result = decompressRecordData(buffer, -1);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Data size must be positive');
    });

    it('should handle buffer too small', () => {
      const buffer = Buffer.alloc(0x10);
      const result = decompressRecordData(buffer, 100);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Buffer too small');
    });
  });

  describe('autoDecompressRecordData', () => {
    it('should automatically detect and handle uncompressed data', () => {
      const testData = Buffer.from('Test Data');
      const buffer = Buffer.alloc(0x18 + testData.length);
      testData.copy(buffer, 0x18);
      
      const result = autoDecompressRecordData(buffer, testData.length);
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(testData);
    });
  });
}); 