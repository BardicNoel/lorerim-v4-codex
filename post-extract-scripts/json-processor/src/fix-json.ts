import { promises as fs } from 'fs';
import path from 'path';

interface FixStats {
  fixedNewlines: number;
  fixedCommas: number;
  fixedQuotes: number;
  fixedBrackets: number;
  fixedDoubleCommas: number;
  fixedNestedStructure: number;
  totalLines: number;
}

async function fixJsonFile(inputFile: string): Promise<void> {
  const outputFile = inputFile.replace('.json', '.fixed.json');
  const stats: FixStats = {
    fixedNewlines: 0,
    fixedCommas: 0,
    fixedQuotes: 0,
    fixedBrackets: 0,
    fixedDoubleCommas: 0,
    fixedNestedStructure: 0,
    totalLines: 0
  };

  // Read all lines into memory
  const fileContent = await fs.readFile(inputFile, 'utf-8');
  const lines = fileContent.split(/\r?\n/);
  stats.totalLines = lines.length;

  const fixedLines: string[] = [];
  let bracketStack: string[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    let nextLine = lines[i + 1] || '';
    const indent = line.match(/^\s*/)?.[0] || '';

    // Track opening brackets
    if (line.trim() === '{') {
      bracketStack.push('{');
    } else if (line.trim() === '[') {
      bracketStack.push('[');
    }

    // Fix double commas
    if (line.trim().endsWith(',,')) {
      line = line.trim().slice(0, -2) + ',';
      stats.fixedDoubleCommas++;
    }

    // Fix newlines between property names and values
    if (line.trim().match(/^\s*"[^"]+"\s*:?\s*$/) && (nextLine.trim().startsWith('{') || nextLine.trim().startsWith('[') || nextLine.trim().startsWith('"'))) {
      if (nextLine.trim() === '{') {
        fixedLines.push(indent + line.trim().replace(/:?\s*$/, '') + ': {');
      } else {
        fixedLines.push(indent + line.trim().replace(/:?\s*$/, '') + ': ' + nextLine);
      }
      i++; // Skip next line
      stats.fixedNewlines++;
      continue;
    }

    // Fix property names with spaces and special characters
    if (line.trim().match(/^\s*"[^"]*[- ][^"]*"\s*:?\s*$/) && (nextLine.trim().startsWith('{') || nextLine.trim().startsWith('[') || nextLine.trim().startsWith('"'))) {
      if (nextLine.trim() === '{') {
        fixedLines.push(indent + line.trim().replace(/:?\s*$/, '') + ': {');
      } else {
        fixedLines.push(indent + line.trim().replace(/:?\s*$/, '') + ': ' + nextLine);
      }
      i++; // Skip next line
      stats.fixedNewlines++;
      continue;
    }

    // Fix missing quotes around property names
    if (line.trim().match(/^[a-zA-Z0-9_]+\s*:/)) {
      fixedLines.push(line.replace(/^([a-zA-Z0-9_]+)\s*:/, '"$1":'));
      stats.fixedQuotes++;
      continue;
    }

    // Fix missing commas between properties
    if (fixedLines.length > 0 &&
        !fixedLines[fixedLines.length - 1].trim().endsWith(',') &&
        !fixedLines[fixedLines.length - 1].trim().endsWith('{') &&
        !fixedLines[fixedLines.length - 1].trim().endsWith('[') &&
        !fixedLines[fixedLines.length - 1].trim().endsWith(':') &&
        line.trim().startsWith('"')) {
      fixedLines[fixedLines.length - 1] = fixedLines[fixedLines.length - 1] + ',';
      stats.fixedCommas++;
    }

    // Fix nested structure issues
    if (line.trim().endsWith('},') && nextLine.trim().startsWith('{')) {
      line = line.trim().slice(0, -1); // Remove trailing comma
      stats.fixedNestedStructure++;
    }

    // Remove trailing comma before closing bracket/brace
    if (nextLine.trim() === '}' || nextLine.trim() === ']') {
      line = line.trim().replace(/,\s*$/, '');
    }

    // Track closing brackets
    if (line.trim() === '}') {
      if (bracketStack.length > 0 && bracketStack[bracketStack.length - 1] === '{') {
        bracketStack.pop();
      }
    } else if (line.trim() === ']') {
      if (bracketStack.length > 0 && bracketStack[bracketStack.length - 1] === '[') {
        bracketStack.pop();
      }
    }

    fixedLines.push(line);
  }

  // Add any missing closing brackets
  while (bracketStack.length > 0) {
    const bracket = bracketStack.pop();
    fixedLines.push(bracket === '{' ? '}' : ']');
    stats.fixedBrackets++;
  }

  await fs.writeFile(outputFile, fixedLines.join('\n'));

  console.log('\n=== JSON Fixing Statistics ===');
  console.log(`Total lines processed: ${stats.totalLines}`);
  console.log(`Fixed newlines: ${stats.fixedNewlines}`);
  console.log(`Fixed commas: ${stats.fixedCommas}`);
  console.log(`Fixed quotes: ${stats.fixedQuotes}`);
  console.log(`Fixed brackets: ${stats.fixedBrackets}`);
  console.log(`Fixed double commas: ${stats.fixedDoubleCommas}`);
  console.log(`Fixed nested structure: ${stats.fixedNestedStructure}`);
  console.log(`\nFixed file saved to: ${outputFile}`);
}

// Run if this file is executed directly
if (require.main === module) {
  const inputFile = process.argv[2];
  
  if (!inputFile) {
    console.error('Please provide an input file path');
    process.exit(1);
  }

  fixJsonFile(inputFile).catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });
}

export { fixJsonFile }; 