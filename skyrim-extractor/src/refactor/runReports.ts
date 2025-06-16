import { BufferMeta } from "./types";
import { formatGrupLabelDisplay } from "./formatter";
import { ParsedRecord } from "@lorerim/platform-types";

export function reportPluginSummaries(bufferMetas: BufferMeta[]) {
    const plugins: Record<string, { count: number; size: number }> = {};
  
    for (const m of bufferMetas) {
      const key = m.sourcePlugin;
      if (!plugins[key]) plugins[key] = { count: 0, size: 0 };
      plugins[key].count++;
      plugins[key].size += m.size;
    }
  
    console.log("==== Plugin Summaries ====");
    console.table(plugins);
  }
  

  export function reportGrupDistribution(bufferMetas: BufferMeta[]) {
    const grups = bufferMetas.filter(m => m.tag === 'GRUP' && m.parentPath.length === 0);
    const result: Record<string, number> = {};
  
    grups.forEach(g => {
      const label = formatGrupLabelDisplay(g.label!);
      result[label] = (result[label] || 0) + 1;
    });
  
    console.log("==== Grup Distribution ====");
    console.table(result);
  }

export function reportRecordTypeDistribution(bufferMetas: BufferMeta[]) {
  // Filter out GRUPs and count records by type
  const records = bufferMetas.filter(m => m.tag !== 'GRUP');
  const totalRecords = records.length;
  
  const distribution = records.reduce((acc, record) => {
    acc[record.tag] = (acc[record.tag] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Convert to array of objects for console.table
  const tableData = Object.entries(distribution)
    .sort(([, a], [, b]) => b - a)
    .map(([type, count]) => ({
      Type: type,
      Count: count.toLocaleString(),
      Percentage: `${((count / totalRecords) * 100).toFixed(1)}%`
    }));

  console.log("==== Record Type Distribution ====");
  console.table(tableData);
}

export function reportParsedRecords(parsedRecordDict: Record<string, ParsedRecord[]>) {
  const tableData = Object.entries(parsedRecordDict).map(([type, records]) => ({
    Type: type,
    Count: records.length.toLocaleString()
  }));

  console.log("==== Parsed Records ====");
  console.table(tableData);
}