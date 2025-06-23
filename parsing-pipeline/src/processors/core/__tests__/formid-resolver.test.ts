import { createFormIdResolverProcessor } from '../formid-resolver';
import * as fs from 'fs';
import * as path from 'path';

// Mock the platform types
jest.mock('@lorerim/platform-types', () => ({
  resolveGlobalFromReference: jest.fn(),
  formatFormId: jest.fn(),
}));

// Mock fs
jest.mock('fs', () => ({
  promises: {
    readFile: jest.fn(),
  },
}));

describe('FormIdResolverProcessor', () => {
  const mockPluginRegistry = {
    'skyrim.esm': {
      name: 'Skyrim.esm',
      fullPath: '/path/to/skyrim.esm',
      modFolder: 'Skyrim',
      isEsl: false,
      loadOrder: 0,
      inTypeOrder: 0,
      masters: [],
    },
    'wintersun.esp': {
      name: 'Wintersun.esp',
      fullPath: '/path/to/wintersun.esp',
      modFolder: 'Wintersun',
      isEsl: false,
      loadOrder: 1,
      inTypeOrder: 1,
      masters: ['Skyrim.esm'],
    },
  };

  const sampleData = [
    {
      meta: {
        plugin: 'Wintersun.esp',
        formId: '0x00001234',
      },
      decodedData: {
        PNAM: '0x00005678',
        CNAM: '0x00009ABC',
      },
    },
    {
      meta: {
        plugin: 'Skyrim.esm',
        formId: '0x0000DEF0',
      },
      decodedData: {
        PNAM: '0x00001111',
      },
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (fs.promises.readFile as jest.Mock).mockResolvedValue(JSON.stringify(mockPluginRegistry));
  });

  it('should resolve FormIDs using plugin registry', async () => {
    const { resolveGlobalFromReference, formatFormId } = require('@lorerim/platform-types');

    // Mock the resolution functions
    resolveGlobalFromReference.mockReturnValue(0x01005678);
    formatFormId.mockImplementation(
      (id: number) => `0x${id.toString(16).padStart(8, '0').toUpperCase()}`
    );

    const processor = createFormIdResolverProcessor({
      name: 'test',
      type: 'formid-resolver',
      pluginRegistryPath: '/path/to/registry.json',
      contextPluginField: 'meta.plugin',
      targetFields: [{ field: 'decodedData.PNAM' }, { field: 'decodedData.CNAM' }],
    });

    const result = await processor.transform(sampleData);
    const stats = processor.getStats?.();

    expect(result).toHaveLength(2);
    expect(result[0].decodedData.PNAM_resolved).toBe('0x01005678');
    expect(result[0].decodedData.CNAM_resolved).toBe('0x01005678');
    expect(stats?.recordsProcessed).toBe(2);
    expect(stats?.formIdsResolved).toBe(3); // 2 from first record, 1 from second
  });

  it('should apply conditions correctly', async () => {
    const { resolveGlobalFromReference, formatFormId } = require('@lorerim/platform-types');

    resolveGlobalFromReference.mockReturnValue(0x01005678);
    formatFormId.mockImplementation(
      (id: number) => `0x${id.toString(16).padStart(8, '0').toUpperCase()}`
    );

    const processor = createFormIdResolverProcessor({
      name: 'test',
      type: 'formid-resolver',
      pluginRegistryPath: '/path/to/registry.json',
      contextPluginField: 'meta.plugin',
      targetFields: [{ field: 'decodedData.PNAM' }],
      conditions: [
        {
          field: 'meta.plugin',
          operator: 'contains',
          value: 'Wintersun',
        },
      ],
    });

    const result = await processor.transform(sampleData);
    const stats = processor.getStats?.();

    // Only the Wintersun record should be processed
    expect(result[0].decodedData.PNAM_resolved).toBe('0x01005678');
    expect(result[1].decodedData.PNAM_resolved).toBeUndefined();
    expect(stats?.formIdsResolved).toBe(1);
  });

  it('should handle custom output field names', async () => {
    const { resolveGlobalFromReference, formatFormId } = require('@lorerim/platform-types');

    resolveGlobalFromReference.mockReturnValue(0x01005678);
    formatFormId.mockImplementation(
      (id: number) => `0x${id.toString(16).padStart(8, '0').toUpperCase()}`
    );

    const processor = createFormIdResolverProcessor({
      name: 'test',
      type: 'formid-resolver',
      pluginRegistryPath: '/path/to/registry.json',
      contextPluginField: 'meta.plugin',
      targetFields: [
        {
          field: 'decodedData.PNAM',
          outputField: 'decodedData.PNAM_global',
        },
      ],
    });

    const result = await processor.transform(sampleData);

    expect(result[0].decodedData.PNAM_global).toBe('0x01005678');
    // Both custom and default output fields are created
    expect(result[0].decodedData.PNAM_resolved).toBe('0x01005678');
  });

  it('should handle missing context plugin gracefully', async () => {
    const dataWithMissingPlugin = [
      {
        meta: {
          plugin: 'MissingPlugin.esp',
          formId: '0x00001234',
        },
        decodedData: {
          PNAM: '0x00005678',
        },
      },
    ];

    const processor = createFormIdResolverProcessor({
      name: 'test',
      type: 'formid-resolver',
      pluginRegistryPath: '/path/to/registry.json',
      contextPluginField: 'meta.plugin',
      targetFields: [{ field: 'decodedData.PNAM' }],
    });

    const result = await processor.transform(dataWithMissingPlugin);
    const stats = processor.getStats?.();

    expect(result).toHaveLength(1);
    expect(result[0].decodedData.PNAM_resolved).toBeUndefined();
    expect(stats?.formIdsFailed).toBe(0); // No resolution attempted
  });

  it('should handle invalid FormID formats', async () => {
    const dataWithInvalidFormId = [
      {
        meta: {
          plugin: 'Wintersun.esp',
          formId: '0x00001234',
        },
        decodedData: {
          PNAM: 'invalid_formid',
        },
      },
    ];

    const processor = createFormIdResolverProcessor({
      name: 'test',
      type: 'formid-resolver',
      pluginRegistryPath: '/path/to/registry.json',
      contextPluginField: 'meta.plugin',
      targetFields: [{ field: 'decodedData.PNAM' }],
    });

    const result = await processor.transform(dataWithInvalidFormId);
    const stats = processor.getStats?.();

    expect(result).toHaveLength(1);
    expect(result[0].decodedData.PNAM_resolved).toBeUndefined();
    expect(stats?.formIdsFailed).toBe(1);
  });

  it('should process arrays of objects with formId fields', async () => {
    const { resolveGlobalFromReference, formatFormId } = require('@lorerim/platform-types');

    resolveGlobalFromReference.mockReturnValue(0x01005678);
    formatFormId.mockImplementation(
      (id: number) => `0x${id.toString(16).padStart(8, '0').toUpperCase()}`
    );

    const dataWithArray = [
      {
        meta: {
          plugin: 'Wintersun.esp',
          formId: '0x00001234',
        },
        religionData: {
          values: [
            { formId: '0x00005678', name: 'Deity1' },
            { formId: '0x00009ABC', name: 'Deity2' },
          ],
        },
      },
    ];

    const processor = createFormIdResolverProcessor({
      name: 'test',
      type: 'formid-resolver',
      pluginRegistryPath: '/path/to/registry.json',
      contextPluginField: 'meta.plugin',
      targetFields: [
        {
          field: 'religionData.values[].formId',
          outputField: 'religionData.values[].formId_resolved',
        },
      ],
    });

    const result = await processor.transform(dataWithArray);
    const stats = processor.getStats?.();

    expect(result).toHaveLength(1);
    expect(result[0].religionData.values).toHaveLength(2);
    expect(result[0].religionData.values[0].formId_resolved).toBe('0x01005678');
    expect(result[0].religionData.values[1].formId_resolved).toBe('0x01005678');
    expect(result[0].religionData.values[0].name).toBe('Deity1'); // Original data preserved
    expect(result[0].religionData.values[1].name).toBe('Deity2'); // Original data preserved
    expect(stats?.formIdsResolved).toBe(2);
  });

  it('should process arrays with decimal FormID values', async () => {
    const { resolveGlobalFromReference, formatFormId } = require('@lorerim/platform-types');

    resolveGlobalFromReference.mockReturnValue(0x01005678);
    formatFormId.mockImplementation(
      (id: number) => `0x${id.toString(16).padStart(8, '0').toUpperCase()}`
    );

    const dataWithDecimalFormIds = [
      {
        meta: {
          plugin: 'Wintersun.esp',
          formId: '0x00001234',
        },
        religionData: {
          values: [
            { formId: 67193428, name: 'Deity1' }, // Decimal FormID
            { formId: 67214185, name: 'Deity2' }, // Decimal FormID
          ],
        },
      },
    ];

    const processor = createFormIdResolverProcessor({
      name: 'test',
      type: 'formid-resolver',
      pluginRegistryPath: '/path/to/registry.json',
      contextPluginField: 'meta.plugin',
      targetFields: [
        {
          field: 'religionData.values[].formId',
          outputField: 'religionData.values[].formId_resolved',
        },
      ],
    });

    const result = await processor.transform(dataWithDecimalFormIds);
    const stats = processor.getStats?.();

    expect(result).toHaveLength(1);
    expect(result[0].religionData.values).toHaveLength(2);
    expect(result[0].religionData.values[0].formId_resolved).toBe('0x01005678');
    expect(result[0].religionData.values[1].formId_resolved).toBe('0x01005678');
    expect(result[0].religionData.values[0].formId).toBe(67193428); // Original decimal value preserved
    expect(result[0].religionData.values[1].formId).toBe(67214185); // Original decimal value preserved
    expect(stats?.formIdsResolved).toBe(2);
  });
});
