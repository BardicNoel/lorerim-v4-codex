import * as fs from 'fs';
import * as path from 'path';

interface Record {
    [key: string]: any;
}

class RandomSampler {
    private sampleSize: number;
    private records: Record[] = [];
    private totalRecords: number = 0;

    constructor(sampleSize: number) {
        this.sampleSize = sampleSize;
    }

    private cleanJsonString(str: string): string {
        let result = '';
        let inString = false;
        let i = 0;
        
        while (i < str.length) {
            const char = str[i];
            const nextChar = str[i + 1];
            
            // Handle string boundaries
            if (char === '"' && str[i - 1] !== '\\') {
                inString = !inString;
                result += char;
                i++;
                continue;
            }
            
            // Inside string
            if (inString) {
                // Handle escaped characters
                if (char === '\\') {
                    result += char;
                    if (nextChar) {
                        result += nextChar;
                        i += 2;
                        continue;
                    }
                }
                // Replace newlines and control characters with spaces
                else if (char === '\n' || char === '\r' || (char >= '\x00' && char <= '\x1F')) {
                    result += ' ';
                }
                // Keep other characters as is
                else {
                    result += char;
                }
            }
            // Outside string
            else {
                result += char;
            }
            
            i++;
        }
        
        return result;
    }

    private repairJson(str: string): string {
        // Fix missing commas between array elements
        str = str.replace(/\]\s*"/g, '],"');
        str = str.replace(/\]\s*\{/g, '],{');
        str = str.replace(/\]\s*\[/g, '],[');
        str = str.replace(/}\s*"/g, '},"');
        str = str.replace(/}\s*\{/g, '},{');
        str = str.replace(/}\s*\[/g, '},[');
        
        // Fix missing commas between object properties
        str = str.replace(/"\s*"/g, '","');
        str = str.replace(/"\s*\{/g, '",{');
        str = str.replace(/"\s*\[/g, '",[');
        
        return str;
    }

    private processJsonFile(content: string): Record[] {
        try {
            // Clean the content before parsing
            let cleanedContent = this.cleanJsonString(content);
            
            // Try to parse the entire file as JSON
            try {
                const data = JSON.parse(cleanedContent);
                return this.extractRecords(data);
            } catch (error) {
                // If parsing fails, try to repair the JSON
                console.log('Initial parse failed, attempting to repair JSON...');
                cleanedContent = this.repairJson(cleanedContent);
                const data = JSON.parse(cleanedContent);
                return this.extractRecords(data);
            }
        } catch (error) {
            console.error('Failed to parse JSON file:', error);
            // Try to get more context about where the error occurred
            if (error instanceof SyntaxError) {
                const match = error.message.match(/position (\d+)/);
                if (match) {
                    const position = parseInt(match[1]);
                    const start = Math.max(0, position - 50);
                    const end = Math.min(content.length, position + 50);
                    console.error('Error context:', content.substring(start, end));
                }
            }
            return [];
        }
    }

    private extractRecords(data: any): Record[] {
        // If it's an array, return it directly
        if (Array.isArray(data)) {
            return data;
        }
        
        // If it's an object, try to find an array property
        for (const key in data) {
            if (Array.isArray(data[key])) {
                return data[key];
            }
        }
        
        // If no array found, return the object as a single record
        return [data];
    }

    private reservoirSampling(record: Record) {
        this.totalRecords++;
        
        if (this.records.length < this.sampleSize) {
            this.records.push(record);
        } else {
            const j = Math.floor(Math.random() * this.totalRecords);
            if (j < this.sampleSize) {
                this.records[j] = record;
            }
        }
    }

    sampleFromFile(inputPath: string): Record[] {
        console.log(`Reading file: ${inputPath}`);
        const content = fs.readFileSync(inputPath, 'utf-8');
        
        console.log('Processing JSON data...');
        const records = this.processJsonFile(content);
        
        console.log(`Found ${records.length} records`);
        
        // Reset sampling state
        this.records = [];
        this.totalRecords = 0;
        
        // Apply reservoir sampling
        for (const record of records) {
            this.reservoirSampling(record);
        }
        
        return this.records;
    }
}

function main() {
    const inputPath = process.argv[2];
    const sampleSize = parseInt(process.argv[3]) || 100;
    const outputPath = process.argv[4] || path.join(path.dirname(inputPath), 'random-sample.json');

    if (!inputPath) {
        console.error('Please provide an input file path');
        process.exit(1);
    }

    console.log(`Sampling ${sampleSize} records from ${inputPath}...`);
    
    const sampler = new RandomSampler(sampleSize);
    const sample = sampler.sampleFromFile(inputPath);
    
    fs.writeFileSync(outputPath, JSON.stringify(sample, null, 2));
    console.log(`Successfully saved ${sample.length} random records to ${outputPath}`);
}

main(); 