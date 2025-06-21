const fs = require('fs');

function compareFiles(file1Path, file2Path, outputPath) {
    try {
        // Read and process first file
        const content1 = fs.readFileSync(file1Path, 'utf8')
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0)
            .sort();

        // Read and process second file
        const content2 = fs.readFileSync(file2Path, 'utf8')
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0)
            .sort();

        // Find differences
        const additions = content2.filter(item => !content1.includes(item));
        const subtractions = content1.filter(item => !content2.includes(item));
        const common = content1.filter(item => content2.includes(item));

        // Prepare report content
        const report = [
            '=== Comparison Report ===',
            `Total lines in file 1: ${content1.length}`,
            `Total lines in file 2: ${content2.length}`,
            `Common items: ${common.length}`,
            `Total differences: ${additions.length + subtractions.length}`,
            '',
            '=== Additions ===',
            ...additions.map(item => `+ ${item}`),
            '',
            '=== Subtractions ===',
            ...subtractions.map(item => `- ${item}`),
            ''
        ].join('\n');

        // Write to file
        fs.writeFileSync(outputPath, report, 'utf8');
        console.log(`Comparison report written to: ${outputPath}`);

        // Also print to console
        console.log(report);

        return {
            totalDiff: additions.length + subtractions.length,
            additions,
            subtractions,
            common
        };
    } catch (error) {
        console.error('Error comparing files:', error.message);
        process.exit(1);
    }
}

// Check if file paths are provided
if (process.argv.length !== 5) {
    console.log('Usage: node compare-txt.js <file1> <file2> <output-file>');
    process.exit(1);
}

const file1Path = process.argv[2];
const file2Path = process.argv[3];
const outputPath = process.argv[4];

compareFiles(file1Path, file2Path, outputPath);
