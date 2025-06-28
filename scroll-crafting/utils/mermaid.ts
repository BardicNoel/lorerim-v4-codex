// Generalized Mermaid flowchart generator

export interface MermaidNode {
  id: string; // Node ID (no spaces)
  label?: string; // Optional label (can have spaces)
}

export interface MermaidEdge {
  from: string; // from node id
  to: string;   // to node id
}

export interface MermaidFlowchartOptions {
  direction?: 'TD' | 'LR' | 'RL' | 'BT';
}

/**
 * Generates a Mermaid flowchart from nodes and edges.
 * @param nodes List of nodes (id, label)
 * @param edges List of edges (from, to)
 * @param options Flowchart options (direction)
 */
export function generateFlowchart(
  nodes: MermaidNode[],
  edges: MermaidEdge[],
  options: MermaidFlowchartOptions = {}
): string {
  const dir = options.direction || 'TD';
  
  // Escape quotes in labels for Mermaid compatibility
  const nodeLines = nodes.map(n => {
    if (n.label) {
      const escapedLabel = n.label.replace(/"/g, '\\"');
      return `${n.id}["${escapedLabel}"]`;
    }
    return `${n.id}`;
  });
  
  const edgeLines = edges.map(e => `${e.from} --> ${e.to}`);
  
  // Always include an extra newline after the flowchart declaration
  return [
    `flowchart ${dir}`,
    '',
    ...nodeLines,
    ...edgeLines
  ].join('\n');
} 