import { BufferMeta } from "./types";
import { formatGrupLabelDisplay } from "./formatter";

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