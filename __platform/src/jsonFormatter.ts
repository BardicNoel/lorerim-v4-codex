/**
 * Custom JSON formatter that makes data fields with Buffer values compact while keeping other objects readable
 */
export function formatJSON(obj: any, indent = 0): string {
    const space = '  '.repeat(indent);
    
    if (Array.isArray(obj)) {
      // For arrays, check if they contain only primitive values
      const isPrimitiveArray = obj.every(item => 
        typeof item === 'string' || 
        typeof item === 'number' || 
        typeof item === 'boolean' || 
        item === null
      );
      
      if (isPrimitiveArray) {
        // Compact format for primitive arrays
        return `[${obj.join(', ')}]`;
      }
      
      // For arrays of objects, format each item
      return `[\n${obj.map(item => space + '  ' + formatJSON(item, indent + 1)).join(',\n')}\n${space}]`;
    }
    
    if (obj && typeof obj === 'object') {
      // For objects, format each property
      const entries = Object.entries(obj);
      if (entries.length === 0) return '{}';
      
      // Special handling for Buffer objects
      if (obj.type === 'Buffer' && Array.isArray(obj.data)) {
        return `{"type":"Buffer","data":[${obj.data.join(',')}]}`;
      }
      
      return `{\n${entries.map(([key, value]) => {
        return `${space}  "${key}": ${formatJSON(value, indent + 1)}`;
      }).join(',\n')}\n${space}}`;
    }
    
    // For primitives, use standard JSON.stringify
    return JSON.stringify(obj);
  } 