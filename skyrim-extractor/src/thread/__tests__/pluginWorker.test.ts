import { parentPort } from 'worker_threads';
import { readFile } from 'fs/promises';
import { PluginMeta } from '../../types';
import { processPlugin } from '../pluginWorker';

// Mock worker_threads
jest.mock('worker_threads', () => ({
  parentPort: {
    postMessage: jest.fn(),
    on: jest.fn()
  }
}));

// Mock fs/promises
jest.mock('fs/promises', () => ({
  readFile: jest.fn()
}));

describe('Plugin Worker', () => {
  // Helper to create a buffer with a TES4 record
  function createTES4Buffer(): Buffer {
    const buffer = Buffer.alloc(24);
    buffer.write('TES4', 0, 4, 'ascii');
    buffer.writeUInt32LE(4, 4); // Size
    buffer.writeUInt32LE(0, 8); // FormID
    buffer.writeUInt32LE(0, 12); // Flags
    return buffer;
  }

  // Helper to create a buffer with a GRUP record
  function createGRUPBuffer(groupType: number, label: string = ''): Buffer {
    const buffer = Buffer.alloc(24);
    buffer.write('GRUP', 0, 4, 'ascii');
    buffer.writeUInt32LE(24, 4); // Size
    buffer.writeUInt32LE(groupType, 8);
    if (label) {
      buffer.write(label, 12, 4, 'ascii');
    }
    return buffer;
  }

  // Helper to create a buffer with a normal record
  function createNormalRecordBuffer(type: string, dataSize: number = 0): Buffer {
    const buffer = Buffer.alloc(20);
    buffer.write(type, 0, 4, 'ascii');
    buffer.writeUInt32LE(dataSize, 4);
    buffer.writeUInt32LE(0, 8); // FormID
    buffer.writeUInt32LE(0, 12); // Flags
    return buffer;
  }

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('processPlugin', () => {
    const mockPlugin: PluginMeta = {
      name: 'test.esp',
      fullPath: '/path/to/test.esp',
      modFolder: 'test',
      index: 0
    };

    it('should process a plugin with TES4 record', async () => {
      const tes4Buffer = createTES4Buffer();
      (readFile as jest.Mock).mockResolvedValue(tes4Buffer);

      await processPlugin(mockPlugin);

      expect(parentPort?.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'done',
          plugin: 'test.esp',
          manifest: expect.objectContaining({
            pluginName: 'test.esp',
            recordCounts: expect.objectContaining({
              TES4: 1,
              GRUP: 0,
              NORMAL: 0
            })
          })
        })
      );
    });

    it('should handle plugin processing errors', async () => {
      const error = new Error('Test error');
      (readFile as jest.Mock).mockRejectedValue(error);

      await processPlugin(mockPlugin);

      expect(parentPort?.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'error',
          plugin: 'test.esp',
          error: 'Test error'
        })
      );
    });

    it('should process a plugin with GRUP record', async () => {
      const grupBuffer = createGRUPBuffer(0, 'PERK');
      (readFile as jest.Mock).mockResolvedValue(grupBuffer);

      await processPlugin(mockPlugin);

      expect(parentPort?.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'done',
          plugin: 'test.esp',
          manifest: expect.objectContaining({
            recordCounts: expect.objectContaining({
              TES4: 0,
              GRUP: 1,
              NORMAL: 0
            })
          })
        })
      );
    });

    it('should process a plugin with normal record', async () => {
      const normalBuffer = createNormalRecordBuffer('PERK');
      (readFile as jest.Mock).mockResolvedValue(normalBuffer);

      await processPlugin(mockPlugin);

      expect(parentPort?.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'done',
          plugin: 'test.esp',
          manifest: expect.objectContaining({
            recordCounts: expect.objectContaining({
              TES4: 0,
              GRUP: 0,
              NORMAL: 1
            }),
            recordTypes: expect.objectContaining({
              PERK: 1
            })
          })
        })
      );
    });
  });
}); 