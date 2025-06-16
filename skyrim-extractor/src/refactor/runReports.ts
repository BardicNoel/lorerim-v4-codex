import { BufferMeta } from "./types";

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
    const labels = grups.map(g => Buffer.from([g.label! & 0xFF, (g.label! >> 8) & 0xFF, (g.label! >> 16) & 0xFF, (g.label! >> 24) & 0xFF]).toString('ascii'));
    
    const result: Record<string, number> = {};
    labels.forEach(label => result[label] = (result[label] || 0) + 1);
  
    console.log("==== Grup Distribution ====");
    console.table(result);
  }