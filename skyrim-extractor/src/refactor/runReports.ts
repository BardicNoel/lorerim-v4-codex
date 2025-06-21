import { BufferMeta } from "./types";
import { formatGrupLabelDisplay } from "./formatter";
import { ParsedRecord } from "@lorerim/platform-types";
import { writeFile } from "fs/promises";
import { formatJSON } from "@lorerim/platform-types";
import * as path from "path";

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


export function reportBufferParserValidation(bufferMetas: BufferMeta[], parsedRecords: ParsedRecord[]) {
  // Get counts by plugin and type for BufferMeta
  const bufferMetaCounts: Record<string, Record<string, number>> = {};
  for (const meta of bufferMetas) {
    if (meta.tag === "GRUP" || meta.tag === "TES4") continue;
    
    const pluginName = meta.sourcePlugin;
    if (!bufferMetaCounts[pluginName]) {
      bufferMetaCounts[pluginName] = {};
    }
    bufferMetaCounts[pluginName][meta.tag] = (bufferMetaCounts[pluginName][meta.tag] || 0) + 1;
  }

  // Get counts by plugin and type for ParsedRecord
  const parsedRecordCounts: Record<string, Record<string, number>> = {};
  for (const record of parsedRecords) {
    const pluginName = record.meta.plugin;
    if (!parsedRecordCounts[pluginName]) {
      parsedRecordCounts[pluginName] = {};
    }
    parsedRecordCounts[pluginName][record.meta.type] = (parsedRecordCounts[pluginName][record.meta.type] || 0) + 1;
  }

  // Find differences
  const differences: Record<string, Record<string, { bufferMeta: number; parsedRecord: number; diff: number }>> = {};
  
  // Check all plugins and record types
  const allPlugins = new Set([...Object.keys(bufferMetaCounts), ...Object.keys(parsedRecordCounts)]);
  
  for (const plugin of allPlugins) {
    const bufferTypes = bufferMetaCounts[plugin] || {};
    const parsedTypes = parsedRecordCounts[plugin] || {};
    const allTypes = new Set([...Object.keys(bufferTypes), ...Object.keys(parsedTypes)]);
    
    for (const type of allTypes) {
      const bufferCount = bufferTypes[type] || 0;
      const parsedCount = parsedTypes[type] || 0;
      
      if (bufferCount !== parsedCount) {
        if (!differences[plugin]) {
          differences[plugin] = {};
        }
        differences[plugin][type] = {
          bufferMeta: bufferCount,
          parsedRecord: parsedCount,
          diff: bufferCount - parsedCount
        };
      }
    }
  }

  // Create validation report
  const report = {
    summary: {
      totalBufferMetaRecords: bufferMetas.length,
      totalParsedRecords: parsedRecords.length,
      pluginsWithDifferences: Object.keys(differences).length
    },
    differences,
    rawCounts: {
      bufferMeta: bufferMetaCounts,
      parsedRecord: parsedRecordCounts
    }
  };

  // Write report to file
  const reportPath = path.join(process.cwd(), "validation-report.json");
  writeFile(reportPath, formatJSON(report));

  // Print summary to console
  console.log("\nValidation Report Summary:");
  console.log(`Total BufferMeta Records: ${report.summary.totalBufferMetaRecords}`);
  console.log(`Total Parsed Records: ${report.summary.totalParsedRecords}`);
  console.log(`Plugins with Differences: ${report.summary.pluginsWithDifferences}`);
  console.log(`\nDetailed report written to: ${reportPath}`);
}


