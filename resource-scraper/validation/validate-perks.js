#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Function to read and parse JSON file
function readJsonFile(filePath) {
    try {
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`Error reading file ${filePath}:`, error.message);
        process.exit(1);
    }
}

// Function to count occurrences of each key
function countOccurrences(data) {
    const counts = new Map();
    
    for (const item of data) {
        const key = `${item.plugin}:${item.formId}`;
        counts.set(key, (counts.get(key) || 0) + 1);
    }
    
    return counts;
}

// Function to generate comprehensive report
function generateReport(sourceData, targetData) {
    const sourceCounts = countOccurrences(sourceData);
    const targetCounts = countOccurrences(targetData);
    
    // Get unique keys from both datasets
    const allKeys = new Set([...sourceCounts.keys(), ...targetCounts.keys()]);
    
    // Initialize counters
    let sourceDuplicates = 0;
    let targetDuplicates = 0;
    let missingInTarget = 0;
    
    // Prepare detailed reports
    const duplicateReport = {
        source: [],
        target: []
    };
    
    const missingReport = [];
    
    // Initialize JSON report structure
    const jsonReport = {
        totalSizes: {
            source: sourceData.length,
            target: targetData.length
        },
        missingByPlugin: {},
        missingList: [],
        additionalByPlugin: {},
        additionalList: []
    };
    
    // Analyze each key
    for (const key of allKeys) {
        const sourceCount = sourceCounts.get(key) || 0;
        const targetCount = targetCounts.get(key) || 0;
        
        // Check for duplicates
        if (sourceCount > 1) {
            sourceDuplicates++;
            duplicateReport.source.push(`${key}: ${sourceCount} occurrences`);
        }
        if (targetCount > 1) {
            targetDuplicates++;
            duplicateReport.target.push(`${key}: ${targetCount} occurrences`);
        }
        
        // Check for missing entries
        if (sourceCount > 0 && targetCount === 0) {
            missingInTarget++;
            missingReport.push(key);
            
            // Add to JSON report
            const [plugin, formId] = key.split(':');
            const sourceItem = sourceData.find(item => item.plugin === plugin && item.formId === formId);
            if (!jsonReport.missingByPlugin[plugin]) {
                jsonReport.missingByPlugin[plugin] = [];
            }
            jsonReport.missingByPlugin[plugin].push(sourceItem.fileId);
            jsonReport.missingList.push(sourceItem.fileId);
        }
        
        // Check for additional entries (in target but not in source)
        if (sourceCount === 0 && targetCount > 0) {
            const [plugin, formId] = key.split(':');
            const targetItem = targetData.find(item => item.plugin === plugin && item.formId === formId);
            if (!jsonReport.additionalByPlugin[plugin]) {
                jsonReport.additionalByPlugin[plugin] = [];
            }
            jsonReport.additionalByPlugin[plugin].push(targetItem.fileId);
            jsonReport.additionalList.push(targetItem.fileId);
        }
    }
    
    // Generate the report
    console.log('\n=== COMPREHENSIVE REPORT ===');
    console.log('\nTotal Counts:');
    console.log(`Source data: ${sourceData.length} total entries`);
    console.log(`Target data: ${targetData.length} total entries`);
    
    console.log('\nDuplicate Analysis:');
    console.log(`Source data: ${sourceDuplicates} entries have duplicates`);
    console.log(`Target data: ${targetDuplicates} entries have duplicates`);
    
    if (duplicateReport.source.length > 0) {
        console.log('\nDetailed Source Duplicates:');
        duplicateReport.source.forEach(entry => console.log(entry));
    }
    
    if (duplicateReport.target.length > 0) {
        console.log('\nDetailed Target Duplicates:');
        duplicateReport.target.forEach(entry => console.log(entry));
    }
    
    console.log('\nMissing Entries Analysis:');
    console.log(`${missingInTarget} entries from source are missing in target`);
    
    if (missingReport.length > 0) {
        console.log('\nMissing Entries:');
        missingReport.forEach(entry => console.log(entry));
    }

    // Write JSON report
    const reportPath = path.join(__dirname, 'validation-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(jsonReport, null, 2));
    console.log(`\nJSON report written to: ${reportPath}`);
}

// Main function
function main() {
    // Define the validation directory path
    const validationDir = path.join(__dirname);
    
    // Define the source and target file paths
    const sourceFile = path.join(validationDir, 'xEdit.json');
    const targetFile = path.join(validationDir, 'PERK.json');

    console.log('Loading files:');
    console.log(`Source: ${sourceFile}`);
    console.log(`Target: ${targetFile}`);

    // Read both JSON files
    const sourceData = readJsonFile(sourceFile);
    const targetData = readJsonFile(targetFile);

    console.log('\nFiles loaded successfully.');

    const parseHex = (id) => parseInt(id, 16)
    const rawId = (id) => id & 0x00FFFFFF
    const shapeId = (id) => id.toString(16).padStart(8, "0").toLowerCase()
    const makeId = (id) => ({fileId:id, formId: shapeId(rawId(parseHex(id)))})

    const shapedSourceData = sourceData.map(s => ({plugin: s.plugin, ...makeId(s.form_id)}))
    const shapedTargetData = targetData.map(s => ({plugin: s.meta.plugin, ...makeId(s.meta.formId)}))

    console.log('Source data structure:', shapedSourceData[0]);
    console.log('Target data structure:', shapedTargetData[0]);

    // Generate comprehensive report
    generateReport(shapedSourceData, shapedTargetData);
}

// Run the script
main();
