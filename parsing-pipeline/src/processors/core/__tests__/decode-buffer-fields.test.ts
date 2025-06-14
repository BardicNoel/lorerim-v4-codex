// NOTE: To import JSON files, ensure your tsconfig.json includes:
//   "resolveJsonModule": true,
//   "esModuleInterop": true

import { createDecodeBufferFieldsProcessor } from '../decode-buffer-fields';
import { MGEF_DECODE_CONFIG } from '../decode-buffer-fields';
import { JsonRecord } from '../../../types/pipeline';
import sampleMGEF from './__mocks__/MGEF_record.json';

// Define the type for our mock data
interface MockBufferData {
  type: string;
  data: number[];
}

interface MockRecord {
  meta: {
    type: string;
    formId: string;
    plugin: string;
  };
  data: {
    [key: string]: MockBufferData[];
  };
  header: string;
}

describe('DecodeBufferFields Processor', () => {
  describe('MGEF Record Decoding', () => {
    it('should decode MGEF record fields correctly', async () => {
      const processor = createDecodeBufferFieldsProcessor(MGEF_DECODE_CONFIG);
      const mockRecord = sampleMGEF as unknown as MockRecord;
      const result = await processor.transform([mockRecord as unknown as JsonRecord]);
      expect(result[0].meta).toEqual(mockRecord.meta);
      const decodedData = result[0].data as Record<string, any>;
      expect(decodedData.EDID).toBe('WSN_Daedra_MolagBal_Boon2_Effect_ProcOnT');
      expect(decodedData.FULL).toBe('Delete');
      expect(decodedData.MDOB).toBe('0d4c4c55');
      expect(decodedData.DATA).toHaveLength(152);
      expect(decodedData.SNDD).toEqual([]);
      expect(decodedData.DNAM).toBe('');
      expect(decodedData.CTDA).toContain('Banished to Oblivion!');
    });

    it('should handle empty or invalid buffer data', async () => {
      const processor = createDecodeBufferFieldsProcessor(MGEF_DECODE_CONFIG);
      const emptyRecord: JsonRecord = {
        meta: { type: 'MGEF', formId: '00000000', plugin: 'test.esp' },
        data: {
          EDID: [],
          VMAD: [],
          FULL: [],
          MDOB: [],
          DATA: [],
          SNDD: [],
          DNAM: [],
          CTDA: []
        },
        header: ''
      };
      const result = await processor.transform([emptyRecord]);
      const decodedData = result[0].data as Record<string, any>;
      expect(decodedData.EDID).toBe('');
      expect(decodedData.FULL).toBe('');
      expect(decodedData.MDOB).toBe('');
      expect(decodedData.DATA).toBe('');
      expect(decodedData.SNDD).toEqual([]);
      expect(decodedData.DNAM).toBe('');
      expect(decodedData.CTDA).toEqual([]);
    });

    it('should preserve non-buffer fields', async () => {
      const processor = createDecodeBufferFieldsProcessor(MGEF_DECODE_CONFIG);
      const mockRecord = sampleMGEF as unknown as MockRecord;
      const recordWithExtraFields: JsonRecord = {
        meta: mockRecord.meta,
        data: {
          ...mockRecord.data,
          extraField: 'test',
          numberField: 123
        },
        header: mockRecord.header
      };
      const result = await processor.transform([recordWithExtraFields]);
      const decodedData = result[0].data as Record<string, any>;
      expect(decodedData.extraField).toBe('test');
      expect(decodedData.numberField).toBe(123);
    });
  });
}); 