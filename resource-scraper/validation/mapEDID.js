const fs = require('fs');
const path = require('path');

// Read and parse the JSON file
const jsonData = JSON.parse(fs.readFileSync(path.join(__dirname, '1.PERK_Analysis.json'), 'utf8'));
console.log(jsonData[0]);
const ordinator = jsonData.filter(item => item.meta.plugin === "Ordinator - Perks of Skyrim.esp");
console.log(ordinator.length);
// Map through the array and return each item
const mappedData = ordinator.map(item => item.decodedData.EDID).sort((a, b) => a.localeCompare(b));
console.log(mappedData.length);
console.log(mappedData);

// Convert to string with proper formatting
const outputString = mappedData.join('\n');

// Write to txt file
fs.writeFileSync(
  path.join(__dirname, '1.PERK_Analysis.txt'),
  outputString,
  'utf8'
);
