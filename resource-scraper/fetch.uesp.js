const fetch = require('node-fetch');
const cheerio = require('cheerio');
const { writeFileSync } = require('fs');
const path = require('path');

async function fetchAllTables(record) {
  const url = `https://en.uesp.net/wiki/Skyrim_Mod:Mod_File_Format/${record}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`❌ Fetch failed for ${record}: ${res.status}`);
  const html = await res.text();
  const $ = cheerio.load(html);

  const allTables = [];

  $('table.wikitable').each((i, table) => {
    const headers = $(table).find('tr').first().find('th').map((_, el) => $(el).text().trim()).get();
    const rows = $(table).find('tr').slice(1).map((_, row) => {
      const cells = $(row).find('td').map((_, cell) => $(cell).text().trim()).get();
      const entry = {};
      headers.forEach((header, idx) => {
        entry[header || `col${idx}`] = cells[idx] || '';
      });
      return entry;
    }).get();

    if (rows.length) {
      allTables.push({ headers, rows });
    }
  });

  return { record, tables: allTables };
}

async function main() {
  const recordTypes = ['PERK', 'WEAP', 'NPC_', 'ARMO', 'LVLI', 'GMST', 'KYWD', 'TES4', 'FACT'];

  for (const rec of recordTypes) {
    try {
      const parsed = await fetchAllTables(rec);
      const outPath = path.join(__dirname, `${rec}_tables.json`);
      writeFileSync(outPath, JSON.stringify(parsed, null, 2));
      console.log(`✅ Saved ${parsed.tables.length} tables from ${rec} to ${outPath}`);
    } catch (err) {
      console.error(`❌ Error with ${rec}: ${err.message}`);
    }
  }
}

main();
