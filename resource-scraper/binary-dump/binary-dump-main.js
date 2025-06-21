import fs from 'fs';
import { hexDump } from './binary_dump.js';

// Configuration constants
const CODEX_ROOT = "../../"
const MOD_SAMPLES_DIR = `${CODEX_ROOT}/data/mod-samples` // Common input for binary files
const INPUT_FILE = `${MOD_SAMPLES_DIR}/Wintersun Skillrate Alternative/Wintersun Skillrate Alternative.esp`;  // Path to input Skyrim .esp file
const OUTPUT_FILE = `${CODEX_ROOT}/output/dumps/wsn-skillrate-alternative.esp.hex`; // Path for hex dump output
const MODE = 'full';  // 'full' or 'slice'
const SLICE_START = 0;  // Starting offset for slice mode
const SLICE_LENGTH = 1024;  // Length of slice in bytes

async function main() {
    try {
        // Read the input file
        const buffer = await fs.promises.readFile(INPUT_FILE);
        
        let hexLines;
        if (MODE === 'full') {
            // Dump entire file
            hexLines = hexDump(buffer, 0, buffer.length);
        } else if (MODE === 'slice') {
            // Dump specific slice
            hexLines = hexDump(buffer, SLICE_START, SLICE_LENGTH);
        } else {
            throw new Error(`Invalid mode: ${MODE}. Must be 'full' or 'slice'`);
        }

        // Write the hex dump to output file
        await fs.promises.writeFile(OUTPUT_FILE, hexLines.join('\n'));
        console.log(`Successfully wrote hex dump to ${OUTPUT_FILE}`);

    } catch (error) {
        console.error('Error processing file:', error.message);
        process.exit(1);
    }
}

main();
