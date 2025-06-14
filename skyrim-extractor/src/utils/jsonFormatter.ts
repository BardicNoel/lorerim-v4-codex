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
    
    return `{\n${entries.map(([key, value]) => {
      // Special handling for data fields with Buffer values
      if (key === 'data' && value && typeof value === 'object') {
        const hasBufferValues = Object.values(value).some(v => 
          Array.isArray(v) && v.length > 0 && Buffer.isBuffer(v[0])
        );
        if (hasBufferValues) {
          // Format each Buffer field on its own line
          const dataEntries = Object.entries(value);
          return `${space}  "${key}": {\n${dataEntries.map(([k, v]) => 
            `${space}    "${k}": ${JSON.stringify(v)}`
          ).join(',\n')}\n${space}  }`;
        }
      }
      return `${space}  "${key}": ${formatJSON(value, indent + 1)}`;
    }).join(',\n')}\n${space}}`;
  }
  
  // For primitives, use standard JSON.stringify
  return JSON.stringify(obj);
} 