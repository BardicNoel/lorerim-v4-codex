import { fixJsonFile } from './fix-json';
import { promises as fs } from 'fs';
import path from 'path';

describe('fix-json', () => {
  const testDir = path.join(__dirname, 'test-files');
  const testInputFile = path.join(testDir, 'test-input.json');
  const testOutputFile = path.join(testDir, 'test-input.fixed.json');

  // Test data based on the example
  const testData = `{
    "someObject": {
      "CTDA - CTDA": 
      {
        "Type": "10000000",
        "Unused": "00 00 00",
        "Comparison Value": "1.000000",
        "Function": "HasPerk",
        "Unused": "00 00",
        "Parameter #1": "FireEnchanter \\"Fire Enchanter\\" [PERK:00058F80]",
        "Parameter #2": "0",
        "Run On": "Subject",
        "Reference": "0",
        "Parameter #3": "-1"
      }
    }
  }`;

  beforeAll(async () => {
    // Create test directory if it doesn't exist
    await fs.mkdir(testDir, { recursive: true });
    // Write test data to file
    await fs.writeFile(testInputFile, testData);
  });

  afterAll(async () => {
    // Clean up test files
    try {
      await fs.unlink(testInputFile);
      await fs.unlink(testOutputFile);
      await fs.rmdir(testDir);
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  });

  it('should fix newlines between property names and values', async () => {
    await fixJsonFile(testInputFile);
    
    const fixedContent = await fs.readFile(testOutputFile, 'utf-8');
    console.log('Fixed content:', fixedContent); // Debug output
    
    const parsed = JSON.parse(fixedContent);
    
    // Verify the structure is correct
    expect(parsed.someObject['CTDA - CTDA']).toBeDefined();
    expect(parsed.someObject['CTDA - CTDA'].Type).toBe('10000000');
    expect(parsed.someObject['CTDA - CTDA'].Function).toBe('HasPerk');
    
    // Verify the property and value are on the same line
    const fixedLines = fixedContent.split('\n');
    const ctdaLines = fixedLines.filter(line => line.includes('CTDA - CTDA'));
    expect(ctdaLines.length).toBe(1);
    expect(ctdaLines[0]).toMatch(/"CTDA - CTDA":\s*{/);
  });

  it('should preserve indentation', async () => {
    await fixJsonFile(testInputFile);
    
    const fixedContent = await fs.readFile(testOutputFile, 'utf-8');
    const fixedLines = fixedContent.split('\n');
    
    // Find the CTDA line
    const ctdaLines = fixedLines.filter(line => line.includes('CTDA - CTDA'));
    expect(ctdaLines.length).toBe(1);
    
    // Check that the indentation is preserved
    const ctdaLinesWithIndent = fixedLines.filter(line => line.includes('CTDA - CTDA') || line.includes('Type'));
    expect(ctdaLinesWithIndent[0].match(/^\s*/)?.[0].length).toBe(6); // 6 spaces for the first level
    expect(ctdaLinesWithIndent[1].match(/^\s*/)?.[0].length).toBe(8); // 8 spaces for the second level
  });

  it('should handle escaped quotes in values', async () => {
    await fixJsonFile(testInputFile);
    
    const fixedContent = await fs.readFile(testOutputFile, 'utf-8');
    const parsed = JSON.parse(fixedContent);
    
    // Verify escaped quotes are preserved
    expect(parsed.someObject['CTDA - CTDA']['Parameter #1']).toBe('FireEnchanter "Fire Enchanter" [PERK:00058F80]');
  });
}); 