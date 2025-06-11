import { createReadStream, createWriteStream, promises as fs } from 'fs';
import path from 'path';
import { selectWinners } from '../src/select-winners';

describe('selectWinners', () => {
  const testDir = path.join(__dirname, 'test-files');
  const inputFile = path.join(testDir, 'test.json');
  const outputFile = path.join(testDir, 'test.winners.json');

  beforeAll(async () => {
    // Create test directory if it doesn't exist
    await fs.mkdir(testDir, { recursive: true });
  });

  afterAll(async () => {
    // Clean up test files
    try {
      await fs.unlink(inputFile);
      await fs.unlink(outputFile);
      await fs.rmdir(testDir);
    } catch (error) {
      // Ignore errors if files don't exist
    }
  });

  beforeEach(async () => {
    // Clean up output file before each test
    try {
      await fs.unlink(outputFile);
    } catch (error) {
      // Ignore error if file doesn't exist
    }
  });

  it('should create a winners file with only winning records', async () => {
    // Create test input file
    const testData = [
      { IsWinner: true, id: 1, data: 'winner1' },
      { IsWinner: false, id: 2, data: 'loser1' },
      { IsWinner: true, id: 3, data: 'winner2' },
      { IsWinner: false, id: 4, data: 'loser2' }
    ];
    await fs.writeFile(inputFile, JSON.stringify(testData, null, 2));

    // Run the processor
    await selectWinners(inputFile);

    // Read and verify the output
    const output = await fs.readFile(outputFile, 'utf-8');
    const winners = JSON.parse(output);

    expect(winners).toHaveLength(2);
    expect(winners[0].id).toBe(1);
    expect(winners[1].id).toBe(3);
  });

  it('should handle empty input', async () => {
    // Create empty test file
    await fs.writeFile(inputFile, '[]');

    // Run the processor
    await selectWinners(inputFile);

    // Read and verify the output
    const output = await fs.readFile(outputFile, 'utf-8');
    const winners = JSON.parse(output);

    expect(winners).toHaveLength(0);
  });

  it('should handle input with no winners', async () => {
    // Create test input with no winners
    const testData = [
      { IsWinner: false, id: 1, data: 'loser1' },
      { IsWinner: false, id: 2, data: 'loser2' }
    ];
    await fs.writeFile(inputFile, JSON.stringify(testData, null, 2));

    // Run the processor
    await selectWinners(inputFile);

    // Read and verify the output
    const output = await fs.readFile(outputFile, 'utf-8');
    const winners = JSON.parse(output);

    expect(winners).toHaveLength(0);
  });

  it('should handle input with all winners', async () => {
    // Create test input with all winners
    const testData = [
      { IsWinner: true, id: 1, data: 'winner1' },
      { IsWinner: true, id: 2, data: 'winner2' }
    ];
    await fs.writeFile(inputFile, JSON.stringify(testData, null, 2));

    // Run the processor
    await selectWinners(inputFile);

    // Read and verify the output
    const output = await fs.readFile(outputFile, 'utf-8');
    const winners = JSON.parse(output);

    expect(winners).toHaveLength(2);
    expect(winners[0].id).toBe(1);
    expect(winners[1].id).toBe(2);
  });

  it('should throw error for non-existent input file', async () => {
    const nonExistentFile = path.join(testDir, 'nonexistent.json');
    await expect(selectWinners(nonExistentFile)).rejects.toThrow();
  });
}); 