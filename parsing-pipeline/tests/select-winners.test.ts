import { promises as fs } from 'fs';
import path from 'path';
import { selectWinners } from './select-winners';

describe('select-winners', () => {
  const testData = `[
    {
      "plugin": "Test.esp",
      "load_order": "FE",
      "form_id": "1A00080A",
      "full_form_id": "FEAEC80A",
      "unique_id": "Test.esp|1A00080A",
      "record_type": "MGEF",
      "editor_id": "Test_Effect_1",
      "winning": true,
      "data": {
        "Record Header": {
          "Signature": "MGEF",
          "Record Flags": "0000000000000000000000000000000000000000000000000000000000000000",
          "FormID": ":00000000"
        },
        "EDID - Editor ID": "Test_Effect_1",
        "FULL - Name": "Test Effect 1"
      }
    },
    {
      "plugin": "Test.esp",
      "load_order": "FE",
      "form_id": "14000802",
      "full_form_id": "FE68B802",
      "unique_id": "Test.esp|14000802",
      "record_type": "MGEF",
      "editor_id": "Test_Effect_2",
      "winning": false,
      "data": {
        "Record Header": {
          "Signature": "MGEF",
          "Record Flags": "0000000000000000000000000000000000000000000000000000000000000000",
          "FormID": ":00000000"
        },
        "EDID - Editor ID": "Test_Effect_2",
        "FULL - Name": "Test Effect 2"
      }
    }
  ]`;

  const tempDir = path.join(__dirname, 'temp');
  const inputFile = path.join(tempDir, 'test-input.json');
  const outputFile = path.join(tempDir, 'test-input.winners.json');

  beforeAll(async () => {
    // Create temp directory if it doesn't exist
    await fs.mkdir(tempDir, { recursive: true });
    // Write test data to input file
    await fs.writeFile(inputFile, testData);
  });

  afterAll(async () => {
    // Clean up temp files
    try {
      await fs.unlink(inputFile);
      await fs.unlink(outputFile);
      await fs.rmdir(tempDir);
    } catch (error) {
      console.error('Error cleaning up test files:', error);
    }
  });

  it('should process JSON and extract winners correctly', async () => {
    // Run the select-winners function
    await selectWinners(inputFile);

    // Read and verify the output file
    const outputContent = await fs.readFile(outputFile, 'utf-8');
    const winners = JSON.parse(outputContent);

    // Verify the results
    expect(Array.isArray(winners)).toBe(true);
    expect(winners.length).toBe(1); // Only one record has winning: true

    // Verify the winner
    expect(winners[0].editor_id).toBe('Test_Effect_1');
    expect(winners[0].winning).toBe(true);
  });

  it('should handle malformed JSON gracefully', async () => {
    // Write malformed JSON to input file
    const malformedData = testData.replace('"winning": true', '"winning": true,');
    await fs.writeFile(inputFile, malformedData);

    // Run the select-winners function
    await expect(selectWinners(inputFile)).rejects.toThrow();
  });
}); 