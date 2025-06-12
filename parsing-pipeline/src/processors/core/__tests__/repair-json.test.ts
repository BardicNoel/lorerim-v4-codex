import { createRepairJsonProcessor } from '../repair-json';

describe('RepairJsonProcessor', () => {
  const defaultConfig = {
    maxAttempts: 3,
    strictMode: false,
    preserveOriginal: true
  };

  it('should handle valid JSON without changes', async () => {
    const processor = createRepairJsonProcessor(defaultConfig);
    const input = [{ name: 'test', value: 123 }];
    
    const result = await processor.transform(input);
    expect(result).toEqual(input);
    
    const stats = processor.getStats?.();
    expect(stats?.recordsRepaired).toBe(0);
  });

  it('should fix double commas', async () => {
    const processor = createRepairJsonProcessor(defaultConfig);
    const input = [{ name: 'test', value: 123 }];
    const corruptedInput = JSON.stringify(input).replace('value', 'value,,');
    
    const result = await processor.transform(JSON.parse(corruptedInput));
    expect(result).toEqual(input);
    
    const stats = processor.getStats?.();
    expect(stats?.doubleCommasFixed).toBeGreaterThan(0);
  });

  it('should fix missing commas between objects', async () => {
    const processor = createRepairJsonProcessor(defaultConfig);
    const input = [{ name: 'test' }, { value: 123 }];
    const corruptedInput = JSON.stringify(input).replace('},{', '}{');
    
    const result = await processor.transform(JSON.parse(corruptedInput));
    expect(result).toEqual(input);
    
    const stats = processor.getStats?.();
    expect(stats?.missingCommasFixed).toBeGreaterThan(0);
  });

  it('should fix unclosed objects', async () => {
    const processor = createRepairJsonProcessor(defaultConfig);
    const input = [{ name: 'test', nested: { value: 123 } }];
    const corruptedInput = JSON.stringify(input).replace(/}$/, '');
    
    const result = await processor.transform(JSON.parse(corruptedInput));
    expect(result).toEqual(input);
    
    const stats = processor.getStats?.();
    expect(stats?.unclosedObjectsFixed).toBeGreaterThan(0);
  });

  it('should replace bad characters with BAD_CHAR notation', async () => {
    const processor = createRepairJsonProcessor(defaultConfig);
    const input = [{ name: 'test\u0000', value: 123 }];
    
    const result = await processor.transform(input);
    expect(result).toEqual([{ name: 'test{BAD_CHAR:0}', value: 123 }]);
    
    const stats = processor.getStats?.();
    expect(stats?.badCharsReplaced).toBeGreaterThan(0);
  });

  it('should preserve original record when repair fails and preserveOriginal is true', async () => {
    const processor = createRepairJsonProcessor(defaultConfig);
    const input = [{ name: 'test', value: 123 }];
    
    // Intentionally corrupt the JSON
    const corruptedInput = JSON.stringify(input).replace('{', '');
    
    const result = await processor.transform(JSON.parse(corruptedInput));
    expect(result).toEqual(input);
  });

  it('should throw error when repair fails and preserveOriginal is false', async () => {
    const processor = createRepairJsonProcessor({
      ...defaultConfig,
      preserveOriginal: false
    });
    
    // Intentionally corrupt the JSON
    const input = JSON.stringify([{ name: 'test', value: 123 }]).replace('{', '');
    
    await expect(processor.transform(JSON.parse(input))).rejects.toThrow();
  });
}); 