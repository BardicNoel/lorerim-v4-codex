const fetch = require('node-fetch');
const cheerio = require('cheerio');
const { writeFileSync, mkdirSync, existsSync } = require('fs');
const path = require('path');

function tableToMarkdown(headers, rows) {
  const esc = (txt) => (txt || '').replace(/\|/g, '\\|');
  const head = `| ${headers.map(esc).join(' | ')} |`;
  const sep = `| ${headers.map(() => '---').join(' | ')} |`;
  const body = rows.map(row => `| ${headers.map(h => esc(row[h] || '')).join(' | ')} |`);
  return [head, sep, ...body].join('\n');
}

async function fetchToMarkdown(record, outDir) {
  const url = `https://en.uesp.net/wiki/Skyrim_Mod:Mod_File_Format/${record}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`❌ Fetch failed for ${record}: ${res.status}`);
  const html = await res.text();
  const $ = cheerio.load(html);

  let output = `# ${record} Record Structure (UESP)\n\n`;
  output += `*Source: [UESP - ${record}](${url})*\n\n`;

  $('h2, h3, table.wikitable').each((_, el) => {
    const tag = el.tagName.toLowerCase();
    if (tag === 'h2' || tag === 'h3') {
      const title = $(el).text().replace('[edit]', '').trim();
      output += `## ${title}\n\n`;
    } else if (tag === 'table') {
      const headers = $(el).find('tr').first().find('th').map((_, th) => $(th).text().trim()).get();
      const rows = $(el).find('tr').slice(1).map((_, tr) => {
        const tds = $(tr).find('td').map((_, td) => $(td).text().trim()).get();
        const entry = {};
        headers.forEach((h, idx) => entry[h || `col${idx}`] = tds[idx] || '');
        return entry;
      }).get();
      if (headers.length && rows.length) {
        output += tableToMarkdown(headers, rows) + '\n\n';
      }
    }
  });

  const outPath = path.join(outDir, `${record}.md`);
  writeFileSync(outPath, output);
  console.log(`✅ Saved ${record}.md`);
}

async function main() {
  const recordTypes = ['GMST', 'KYWD', 'LCRT', 'AACT', 'TXST', 'GLOB', 'CLAS', 'FACT', 'HDPT', 'HAIR', 'EYES', 'RACE', 'SOUN', 'ASPC', 'MGEF', 'SCPT', 'LTEX', 'ENCH', 'SPEL', 'SCRL', 'ACTI', 'TACT', 'ARMO', 'BOOK', 'CONT', 'DOOR', 'INGR', 'LIGH', 'MISC', 'APPA', 'STAT', 'SCOL', 'MSTT', 'PWAT', 'GRAS', 'TREE', 'CLDC', 'FLOR', 'FURN', 'WEAP', 'AMMO', 'NPC_', 'LVLN', 'KEYM', 'ALCH', 'IDLM', 'COBJ', 'PROJ', 'HAZD', 'SLGM', 'LVLI', 'WTHR', 'CLMT', 'SPGD', 'RFCT', 'REGN', 'NAVI', 'CELL', 'WRLD', 'DIAL', 'QUST', 'IDLE', 'PACK', 'CSTY', 'LSCR', 'LVSP', 'ANIO', 'WATR', 'EFSH', 'EXPL', 'DEBR', 'IMGS', 'IMAD', 'FLST', 'PERK', 'BPTD', 'ADDN', 'AVIF', 'CAMS', 'CPTH', 'VTYP', 'MATT', 'IPCT', 'IPDS', 'ARMA', 'ECZN', 'LCTN', 'MESG', 'RGDL', 'DOBJ', 'LGTM', 'MUSC', 'FSTP', 'FSTS', 'SMBN', 'SMQN', 'SMEN', 'DLBR', 'MUST', 'DLVW', 'WOOP', 'SHOU', 'EQUP', 'RELA', 'SCEN', 'ASTP', 'OTFT', 'ARTO', 'MATO', 'MOVT', 'HAZD', 'SNDR', 'DUAL', 'SNCT', 'SOPM', 'COLL', 'CLFM', 'REVB'];
  const outputDir = path.join(__dirname, 'scraped-md');
  if (!existsSync(outputDir)) mkdirSync(outputDir);

  for (const rec of recordTypes) {
    try {
      await fetchToMarkdown(rec, outputDir);
    } catch (err) {
      console.error(`❌ Failed for ${rec}: ${err.message}`);
    }
  }
}

main();
