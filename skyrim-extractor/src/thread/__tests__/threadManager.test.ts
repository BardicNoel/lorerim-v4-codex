import { Worker } from 'worker_threads';
import path from 'path';
import { PluginMeta } from '../../types';
import { createThreadManager } from '../threadManager';
import { createRecordAggregator } from '../../utils/recordAggregator';
import { createFileWriter } from '../../utils/fileWriter';

const createMockWorker = () => ({
  on: jest.fn(),
  postMessage: jest.fn(),
  terminate: jest.fn()
});

let mockWorkers: any[] = [];

jest.mock('worker_threads', () => ({
  Worker: jest.fn().mockImplementation(() => {
    const worker = createMockWorker();
    mockWorkers.push(worker);
    return worker;
  })
}));

// Mock fs/promises
jest.mock('fs/promises', () => ({
  mkdir: jest.fn(),
  writeFile: jest.fn()
}));

// Mock record aggregator
jest.mock('../../utils/recordAggregator', () => ({
  createRecordAggregator: jest.fn().mockReturnValue({
    addRecord: jest.fn(),
    getRecords: jest.fn().mockReturnValue([]),
    getStats: jest.fn().mockReturnValue({}),
    clear: jest.fn()
  })
}));

// Mock file writer
jest.mock('../../utils/fileWriter', () => ({
  createFileWriter: jest.fn().mockReturnValue({
    writeRecords: jest.fn(),
    writeStats: jest.fn()
  })
}));

describe('Thread Manager', () => {
  let threadManager: ReturnType<typeof createThreadManager>;
  const mockPlugins: PluginMeta[] = [
    {
      name: 'test1.esp',
      fullPath: '/path/to/test1.esp',
      modFolder: 'test1',
      index: 0
    },
    {
      name: 'test2.esp',
      fullPath: '/path/to/test2.esp',
      modFolder: 'test2',
      index: 1
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockWorkers = [];
    threadManager = createThreadManager();
  });

  afterEach(() => {
    mockWorkers = [];
  });

  describe('processPlugins', () => {
    it('should process multiple plugins concurrently', async () => {
      mockWorkers.forEach(worker => {
        worker.on.mockImplementation((event: string, callback: (message: any) => void) => {
          if (event === 'message') {
            callback({ status: 'done', records: [] });
          }
        });
      });
      await threadManager.processPlugins(mockPlugins, '/output');
      expect(Worker).toHaveBeenCalledTimes(2);
      expect(Worker).toHaveBeenCalledWith(expect.stringContaining('pluginWorker.js'));
      mockWorkers.forEach(worker => {
        expect(worker.terminate).toHaveBeenCalled();
      });
      const fileWriter = createFileWriter();
      expect(fileWriter.writeRecords).toHaveBeenCalled();
      expect(fileWriter.writeStats).toHaveBeenCalled();
    }, 10000);

    it('should handle worker errors', async () => {
      const mockWorker = mockWorkers[0];
      mockWorker.on.mockImplementation((event: string, callback: (error: Error | { status: string, records: any[] }) => void) => {
        if (event === 'error') {
          callback(new Error('Test error'));
        } else if (event === 'message') {
          callback({ status: 'done', records: [] });
        }
      });
      await threadManager.processPlugins([mockPlugins[0]], '/output');
      expect(mockWorker.terminate).toHaveBeenCalled();
    }, 10000);

    it('should handle debug messages from workers', async () => {
      const mockWorker = mockWorkers[0];
      mockWorker.on.mockImplementation((event: string, callback: (message: any) => void) => {
        if (event === 'message') {
          callback({ type: 'debug', message: 'Test debug message' });
          callback({ status: 'done', records: [] });
        }
      });
      await threadManager.processPlugins([mockPlugins[0]], '/output');
      expect(mockWorker.terminate).toHaveBeenCalled();
    }, 10000);

    it('should handle error messages from workers', async () => {
      const mockWorker = mockWorkers[0];
      mockWorker.on.mockImplementation((event: string, callback: (message: any) => void) => {
        if (event === 'message') {
          callback({ type: 'error', message: 'Test error message' });
          callback({ status: 'done', records: [] });
        }
      });
      await threadManager.processPlugins([mockPlugins[0]], '/output');
      expect(mockWorker.terminate).toHaveBeenCalled();
    }, 10000);
  });

  describe('getStats', () => {
    it('should return stats from record aggregator', () => {
      const mockStats = { test: 123 };
      const aggregator = createRecordAggregator();
      (aggregator.getStats as jest.Mock).mockReturnValue(mockStats);

      const stats = threadManager.getStats();
      expect(stats).toBe(mockStats);
    });
  });
}); 