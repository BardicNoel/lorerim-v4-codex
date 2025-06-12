import { describe, it, expect } from 'vitest';
import * as path from 'path';
import * as E from 'fp-ts/lib/Either.js';
import { readTES4Header, readRecords, summarizeFile } from '../src/binary-reader.js';
import type { TES4Header, PluginRecord, RecordSummary } from '../src/binary-reader.js';

describe('Binary Reader', () => {
  const TEST_FILE = path.join(__dirname, 'fixtures/test.esp');

  describe('readTES4Header', () => {
    it('should read TES4 header from a valid ESP file', async () => {
      const result = await readTES4Header(TEST_FILE)();
      if (E.isLeft(result)) {
        console.error('readTES4Header error:', result.left.message);
        throw new Error(`Failed to read TES4 header: ${result.left.message}`);
      }
      expect(E.isRight(result)).toBe(true);
      if (E.isRight(result)) {
        const header = result.right as TES4Header;
        expect(header.type).toBe('TES4');
        expect(typeof header.version).toBe('number');
        expect(typeof header.timestamp).toBe('number');
        expect(typeof header.author).toBe('string');
        expect(typeof header.description).toBe('string');
        expect(Array.isArray(header.masterFiles)).toBe(true);
      }
    });

    it('should handle non-existent file', async () => {
      const result = await readTES4Header(path.join(__dirname, 'fixtures/nonexistent.esp'))();
      
      expect(E.isLeft(result)).toBe(true);
      if (E.isLeft(result)) {
        expect(result.left.message).toContain('Failed to read file');
      }
    });
  });

  describe('readRecords', () => {
    it('should read records from a valid ESP file', async () => {
      const result = await readRecords(TEST_FILE)();
      if (E.isLeft(result)) {
        console.error('readRecords error:', result.left.message);
        throw new Error(`Failed to read records: ${result.left.message}`);
      }
      expect(E.isRight(result)).toBe(true);
      if (E.isRight(result)) {
        const records = result.right as PluginRecord[];
        expect(records.length).toBeGreaterThan(0);
        // Check that at least one record has a type
        expect(records.some(r => typeof r.header.type === 'string')).toBe(true);
        // Check that at least one record has subrecords
        expect(records.some(r => Array.isArray(r.subrecords) && r.subrecords.length > 0)).toBe(true);
        // Check subrecord structure for all records
        records.forEach(record => {
          expect(typeof record.header.type).toBe('string');
          expect(typeof record.header.dataSize).toBe('number');
          expect(typeof record.header.flags).toBe('number');
          expect(typeof record.header.formId).toBe('number');
          expect(typeof record.header.timestamp).toBe('number');
          expect(Array.isArray(record.subrecords)).toBe(true);
          record.subrecords.forEach(subrecord => {
            expect(typeof subrecord.type).toBe('string');
            expect(Buffer.isBuffer(subrecord.data)).toBe(true);
          });
        });
      }
    });

    it('should handle non-existent file', async () => {
      const result = await readRecords(path.join(__dirname, 'fixtures/nonexistent.esp'))();
      
      expect(E.isLeft(result)).toBe(true);
      if (E.isLeft(result)) {
        expect(result.left.message).toContain('Failed to read file');
      }
    });
  });

  describe('summarizeFile', () => {
    it('should generate a summary of the ESP file contents', async () => {
      const result = await summarizeFile(TEST_FILE)();
      expect(E.isRight(result)).toBe(true);
      if (E.isRight(result)) {
        const summary = result.right as RecordSummary;
        expect(typeof summary.header.type).toBe('string');
        expect(typeof summary.header.version).toBe('number');
        expect(typeof summary.header.timestamp).toBe('number');
        expect(typeof summary.header.author).toBe('string');
        expect(typeof summary.header.description).toBe('string');
        expect(Array.isArray(summary.header.masterFiles)).toBe(true);
        expect(typeof summary.totalRecords).toBe('number');
        expect(typeof summary.totalSubrecords).toBe('number');
        expect(typeof summary.fileSize).toBe('number');
        expect(typeof summary.recordCounts).toBe('object');
      }
    });

    it('should handle non-existent file', async () => {
      const result = await summarizeFile(path.join(__dirname, 'fixtures/nonexistent.esp'))();
      
      expect(E.isLeft(result)).toBe(true);
      if (E.isLeft(result)) {
        expect(result.left.message).toContain('Failed to read file');
      }
    });
  });
}); 