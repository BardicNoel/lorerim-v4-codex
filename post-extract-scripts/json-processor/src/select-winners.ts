import { createReadStream, createWriteStream, promises as fs } from 'fs';
import { pipeline } from 'stream/promises';
import { parser } from 'stream-json';
import { streamArray } from 'stream-json/streamers/StreamArray';
import { chain } from 'stream-chain';
import through2 from 'through2';
import path from 'path';
import readline from 'readline';

interface Record {
  IsWinner: boolean;
  RecordKey?: string;
  Plugin?: string;
  [key: string]: any;
}

// Function to clean and properly escape JSON strings
function cleanJsonString(str: string): string {
  return str
    // First, properly escape quotes in string values
    .replace(/"([^"]*)"([^"]*)"([^"]*)"/g, (match, p1, p2, p3) => {
      return `"${p1}\\"${p2}\\"${p3}"`;
    })
    // Handle square brackets in string values
    .replace(/"([^"]*)\[([^"]*)\]([^"]*)"/g, (match, p1, p2, p3) => {
      return `"${p1}\\[${p2}\\]${p3}"`;
    })
    // Remove any remaining control characters
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
    // Fix any double-escaped characters
    .replace(/\\\\/g, '\\')
    // Ensure proper escaping of quotes in the entire string
    .replace(/(?<!\\)"/g, '\\"')
    // Fix newlines between property names and values
    .replace(/"([^"]*)"\s*\n\s*{/g, '"$1": {')
    .replace(/"([^"]*)"\s*\n\s*"/g, '"$1": "')
    .replace(/"([^"]*)"\s*\n\s*\[/g, '"$1": [')
    // Fix missing commas between object properties
    .replace(/"\s*"\s*"/g, '", "')
    // Fix missing commas after object properties
    .replace(/"\s*}\s*"/g, '", "')
    // Fix missing commas between array elements
    .replace(/"\s*]\s*"/g, '", "')
    // Fix missing commas after values
    .replace(/"([^"]*)"\s*"([^"]*)"/g, '"$1", "$2"')
    // Fix missing commas in object properties
    .replace(/"([^"]*)"\s*:\s*"([^"]*)"\s*"([^"]*)"/g, '"$1": "$2", "$3"')
    // Fix missing object keys
    .replace(/"\s*:\s*{/g, '": {')
    // Fix malformed object structures
    .replace(/{([^}]*):([^}]*)}/g, '{"$1": $2}')
    // Fix missing quotes around property names
    .replace(/([{,]\s*)([a-zA-Z0-9_]+)(\s*:)/g, '$1"$2"$3')
    // Fix missing commas in nested objects
    .replace(/"([^"]*)"\s*{\s*"([^"]*)"/g, '"$1": { "$2"')
    // Fix missing commas after nested objects
    .replace(/"}\s*"([^"]*)"/g, '"}, "$1"');
}

// Function to validate and fix JSON structure
function validateAndFixJson(str: string): string {
  let fixed = str;
  let lastFixed = '';
  let attempts = 0;
  const MAX_ATTEMPTS = 5;
  
  // Keep trying to fix the JSON until it's valid or no more changes can be made
  while (fixed !== lastFixed && attempts < MAX_ATTEMPTS) {
    attempts++;
    lastFixed = fixed;
    
    // Fix common JSON structure issues
    fixed = fixed
      // Fix newlines between property names and values
      .replace(/"([^"]*)"\s*\n\s*{/g, '"$1": {')
      .replace(/"([^"]*)"\s*\n\s*"/g, '"$1": "')
      .replace(/"([^"]*)"\s*\n\s*\[/g, '"$1": [')
      // Fix missing commas between object properties
      .replace(/"\s*}\s*"/g, '", "')
      // Fix missing commas between array elements
      .replace(/"\s*]\s*"/g, '", "')
      // Remove trailing commas in objects
      .replace(/,(\s*})/g, '$1')
      // Remove trailing commas in arrays
      .replace(/,(\s*])/g, '$1')
      // Fix missing quotes around property names
      .replace(/([{,]\s*)([a-zA-Z0-9_]+)(\s*:)/g, '$1"$2"$3')
      // Fix missing colons
      .replace(/"\s*"\s*"/g, '": "')
      // Fix missing commas
      .replace(/"\s*"\s*"/g, '", "')
      // Fix malformed object structures
      .replace(/{([^}]*):([^}]*)}/g, '{"$1": $2}')
      // Fix missing object keys
      .replace(/"\s*:\s*{/g, '": {')
      // Fix nested object issues
      .replace(/{([^{]*){/g, '{$1{')
      .replace(/}([^}]*)}/g, '}$1}')
      // Fix missing commas in nested objects
      .replace(/"([^"]*)"\s*{\s*"([^"]*)"/g, '"$1": { "$2"')
      // Fix missing commas after nested objects
      .replace(/"}\s*"([^"]*)"/g, '"}, "$1"')
      // Fix missing commas after values
      .replace(/"([^"]*)"\s*"([^"]*)"/g, '"$1", "$2"')
      // Fix missing commas in object properties
      .replace(/"([^"]*)"\s*:\s*"([^"]*)"\s*"([^"]*)"/g, '"$1": "$2", "$3"');
  }
  
  return fixed;
}

async function findErrorLine(filePath: string, errorPosition: number): Promise<{ line: number; content: string; context: string[] } | null> {
  const fileStream = createReadStream(filePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let currentPosition = 0;
  let lineNumber = 0;
  let lastLines: string[] = [];
  const contextLines = 5;

  for await (const line of rl) {
    lineNumber++;
    currentPosition += line.length + 1; // +1 for newline
    
    lastLines.push(line);
    if (lastLines.length > contextLines) {
      lastLines.shift();
    }

    if (currentPosition >= errorPosition) {
      // Get the line numbers for context
      const startLine = Math.max(1, lineNumber - contextLines + 1);
      const contextWithNumbers = lastLines.map((l, i) => `${startLine + i}: ${l}`);
      
      return { 
        line: lineNumber, 
        content: line,
        context: contextWithNumbers
      };
    }
  }

  return null;
}

async function selectWinners(inputFile: string): Promise<void> {
  // Check if input file exists
  try {
    await fs.access(inputFile);
  } catch (error) {
    throw new Error(`Input file not found: ${inputFile}`);
  }

  const outputFile = inputFile.replace('.json', '.winners.json');
  let isFirstRecord = true;
  let hasWinners = false;
  let recordCount = 0;
  let currentPosition = 0;
  let lastRecordKey = '';
  let errorCount = 0;
  const MAX_ERRORS = 10;

  const pipeline = chain([
    createReadStream(inputFile),
    through2.obj(
      function(chunk: Buffer, enc: string, callback: (error?: Error | null, chunk?: any) => void) {
        try {
          // Clean and validate the chunk before processing
          const cleanedChunk = cleanJsonString(chunk.toString());
          const validatedChunk = validateAndFixJson(cleanedChunk);
          currentPosition += chunk.length;
          callback(null, Buffer.from(validatedChunk));
        } catch (error) {
          console.error('Error cleaning chunk:', error);
          callback(error as Error);
        }
      }
    ),
    parser(),
    streamArray(),
    through2.obj(
      function(chunk: { value: Record }, enc: string, callback: (error?: Error | null, chunk?: any) => void) {
        try {
          recordCount++;
          if (recordCount % 1000 === 0) {
            console.log(`Processed ${recordCount} records...`);
          }

          // Store the current record key for error reporting
          lastRecordKey = chunk.value.RecordKey || 'unknown';

          if (chunk.value.IsWinner) {
            hasWinners = true;
            // Add comma between records, but not before the first one
            const prefix = isFirstRecord ? '[\n' : ',\n';
            isFirstRecord = false;
            
            const record = JSON.stringify(chunk.value, null, 2);
            callback(null, prefix + record);
          } else {
            callback();
          }
        } catch (error) {
          errorCount++;
          console.error(`Error processing record ${recordCount} (${lastRecordKey}):`, error);
          
          if (errorCount >= MAX_ERRORS) {
            callback(new Error(`Too many errors (${MAX_ERRORS}). Stopping processing.`));
          } else {
            // Skip this record and continue
            callback();
          }
        }
      },
      function(callback: (error?: Error | null, chunk?: any) => void) {
        // If no winners were found, write an empty array
        if (!hasWinners) {
          callback(null, '[]');
        } else {
          // Add closing bracket
          callback(null, '\n]');
        }
      }
    ),
    createWriteStream(outputFile)
  ]);

  return new Promise((resolve, reject) => {
    pipeline.on('end', () => {
      console.log(`Processed ${recordCount} total records`);
      if (errorCount > 0) {
        console.log(`Encountered ${errorCount} errors during processing`);
      }
      console.log(`Winners saved to ${outputFile}`);
      resolve();
    });
    pipeline.on('error', async (error: Error) => {
      console.error('\n=== JSON PARSING ERROR ===');
      console.error('Error:', error.message);
      console.error(`Last processed record: ${lastRecordKey}`);
      
      // Try to find the error location
      const errorInfo = await findErrorLine(inputFile, currentPosition);
      if (errorInfo) {
        console.error('\n=== ERROR LOCATION ===');
        console.error(`Error occurred at line ${errorInfo.line}:`);
        console.error('Problematic line:', errorInfo.content);
        console.error('\nContext (5 lines before error):');
        errorInfo.context.forEach(line => console.error(line));
        console.error('\nPosition in file:', currentPosition, 'bytes');
        console.error('========================\n');
      }
      
      reject(new Error(`Error processing file: ${error.message}`));
    });
  });
}

// Example usage:
async function main() {
  const inputFile = process.argv[2];
  
  if (!inputFile) {
    console.error('Please provide an input file path');
    process.exit(1);
  }

  try {
    await selectWinners(inputFile);
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

// Run if this file is executed directly
if (require.main === module) {
  main();
}

export { selectWinners }; 