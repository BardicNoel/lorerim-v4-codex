const { readFileSync, writeFileSync } = require('fs');

function parseRecordInfo(text) {
  const lines = text.split(/\r?\n/);
  const records = [];
  let currentRecord = null;
  let currentSubrecord = null;

  for (let line of lines) {
    line = line.trim();
    const recordMatch = line.match(/^(\w+)\s+Record Info$/);
    if (recordMatch) {
      if (currentRecord) {
        if (currentSubrecord) currentRecord.Subrecords.push(currentSubrecord);
        records.push(currentRecord);
      }
      currentRecord = { Record: recordMatch[1], Subrecords: [] };
      currentSubrecord = null;
      continue;
    }

    if (!currentRecord) continue;

    if (line.includes("=")) {
      const [key, val] = line.split("=").map(s => s.trim());
      if (!isNaN(val)) currentRecord[key.replace(/\s+/g, "")] = parseFloat(val);
      continue;
    }

    const subMatch = line.match(/^\d+\)\s+(\w+)\s+Subrecord Info:\s+(.*)$/);
    if (subMatch) {
      if (currentSubrecord) currentRecord.Subrecords.push(currentSubrecord);
      currentSubrecord = { Name: subMatch[1], Attributes: subMatch[2].trim() };
      continue;
    }

    let match;
    if ((match = line.match(/^TotalCount\s+=\s+(\d+)/))) currentSubrecord.TotalCount = parseInt(match[1]);
    if ((match = line.match(/^AverageSize\s+=\s+([\d.]+)/))) currentSubrecord.AverageSize = parseFloat(match[1]);
    if ((match = line.match(/^MinSize\s+=\s+(\d+)/))) currentSubrecord.MinSize = parseInt(match[1]);
    if ((match = line.match(/^MaxSize\s+=\s+(\d+)/))) currentSubrecord.MaxSize = parseInt(match[1]);
    if ((match = line.match(/^MinCount\s+=\s+(\d+)/))) currentSubrecord.MinCount = parseInt(match[1]);
    if ((match = line.match(/^MaxCount\s+=\s+(\d+)/))) currentSubrecord.MaxCount = parseInt(match[1]);
  }

  if (currentRecord) {
    if (currentSubrecord) currentRecord.Subrecords.push(currentSubrecord);
    records.push(currentRecord);
  }

  return records;
}

const input = readFileSync('raw.text', 'utf8');
const parsed = parseRecordInfo(input);
writeFileSync('parsed_output.json', JSON.stringify(parsed, null, 2));

console.log('✅ Parsed output written to parsed_output.json');
