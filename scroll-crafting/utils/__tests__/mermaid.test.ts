import { describe, it, expect } from 'vitest';
import { generateFlowchart, MermaidNode, MermaidEdge } from '../mermaid.js';

describe('Mermaid Utility', () => {
  describe('generateFlowchart', () => {
    it('should generate a basic flowchart with nodes and edges', () => {
      const nodes: MermaidNode[] = [
        { id: 'A', label: 'Start' },
        { id: 'B', label: 'End' }
      ];
      const edges: MermaidEdge[] = [
        { from: 'A', to: 'B' }
      ];

      const result = generateFlowchart(nodes, edges);

      expect(result).toBe(
        'flowchart TD\n\nA["Start"]\nB["End"]\nA --> B'
      );
    });

    it('should handle nodes without labels', () => {
      const nodes: MermaidNode[] = [
        { id: 'A' },
        { id: 'B', label: 'End' }
      ];
      const edges: MermaidEdge[] = [
        { from: 'A', to: 'B' }
      ];

      const result = generateFlowchart(nodes, edges);

      expect(result).toBe(
        'flowchart TD\n\nA\nB["End"]\nA --> B'
      );
    });

    it('should handle multiple edges', () => {
      const nodes: MermaidNode[] = [
        { id: 'A', label: 'Start' },
        { id: 'B', label: 'Middle' },
        { id: 'C', label: 'End' }
      ];
      const edges: MermaidEdge[] = [
        { from: 'A', to: 'B' },
        { from: 'B', to: 'C' }
      ];

      const result = generateFlowchart(nodes, edges);

      expect(result).toBe(
        'flowchart TD\n\nA["Start"]\nB["Middle"]\nC["End"]\nA --> B\nB --> C'
      );
    });

    it('should handle complex branching', () => {
      const nodes: MermaidNode[] = [
        { id: 'A', label: 'Root' },
        { id: 'B', label: 'Branch 1' },
        { id: 'C', label: 'Branch 2' },
        { id: 'D', label: 'Leaf 1' },
        { id: 'E', label: 'Leaf 2' }
      ];
      const edges: MermaidEdge[] = [
        { from: 'A', to: 'B' },
        { from: 'A', to: 'C' },
        { from: 'B', to: 'D' },
        { from: 'C', to: 'E' }
      ];

      const result = generateFlowchart(nodes, edges);

      expect(result).toBe(
        'flowchart TD\n\nA["Root"]\nB["Branch 1"]\nC["Branch 2"]\nD["Leaf 1"]\nE["Leaf 2"]\nA --> B\nA --> C\nB --> D\nC --> E'
      );
    });

    it('should use custom direction', () => {
      const nodes: MermaidNode[] = [
        { id: 'A', label: 'Start' },
        { id: 'B', label: 'End' }
      ];
      const edges: MermaidEdge[] = [
        { from: 'A', to: 'B' }
      ];

      const result = generateFlowchart(nodes, edges, { direction: 'LR' });

      expect(result).toBe(
        'flowchart LR\n\nA["Start"]\nB["End"]\nA --> B'
      );
    });

    it('should handle all direction options', () => {
      const nodes: MermaidNode[] = [
        { id: 'A', label: 'Start' },
        { id: 'B', label: 'End' }
      ];
      const edges: MermaidEdge[] = [
        { from: 'A', to: 'B' }
      ];

      const directions = ['TD', 'LR', 'RL', 'BT'] as const;
      
      directions.forEach(direction => {
        const result = generateFlowchart(nodes, edges, { direction });
        expect(result).toContain(`flowchart ${direction}`);
      });
    });

    it('should handle empty nodes and edges', () => {
      const nodes: MermaidNode[] = [];
      const edges: MermaidEdge[] = [];

      const result = generateFlowchart(nodes, edges);

      expect(result).toBe('flowchart TD\n');
    });

    it('should handle nodes with special characters in labels', () => {
      const nodes: MermaidNode[] = [
        { id: 'A', label: 'Node with "quotes"' },
        { id: 'B', label: 'Node with spaces' }
      ];
      const edges: MermaidEdge[] = [
        { from: 'A', to: 'B' }
      ];

      const result = generateFlowchart(nodes, edges);

      expect(result).toBe(
        'flowchart TD\n\nA["Node with \\"quotes\\""]\nB["Node with spaces"]\nA --> B'
      );
    });

    it('should handle FormID-style node IDs', () => {
      const nodes: MermaidNode[] = [
        { id: '0xFE260808', label: 'Destiny' },
        { id: '0xFE26080A', label: 'Focus' }
      ];
      const edges: MermaidEdge[] = [
        { from: '0xFE260808', to: '0xFE26080A' }
      ];

      const result = generateFlowchart(nodes, edges);

      expect(result).toBe(
        'flowchart TD\n\n0xFE260808["Destiny"]\n0xFE26080A["Focus"]\n0xFE260808 --> 0xFE26080A'
      );
    });

    it('should handle duplicate edges gracefully', () => {
      const nodes: MermaidNode[] = [
        { id: 'A', label: 'Start' },
        { id: 'B', label: 'End' }
      ];
      const edges: MermaidEdge[] = [
        { from: 'A', to: 'B' },
        { from: 'A', to: 'B' } // Duplicate edge
      ];

      const result = generateFlowchart(nodes, edges);

      expect(result).toBe(
        'flowchart TD\n\nA["Start"]\nB["End"]\nA --> B\nA --> B'
      );
    });

    it('should handle edges to non-existent nodes', () => {
      const nodes: MermaidNode[] = [
        { id: 'A', label: 'Start' }
      ];
      const edges: MermaidEdge[] = [
        { from: 'A', to: 'B' } // B doesn't exist in nodes
      ];

      const result = generateFlowchart(nodes, edges);

      expect(result).toBe(
        'flowchart TD\n\nA["Start"]\nA --> B'
      );
    });
  });
}); 