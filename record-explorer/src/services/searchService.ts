import Fuse from 'fuse.js';

export interface SearchResult {
  item: any;
  refIndex: number;
  score?: number;
  matches?: Array<{
    indices: number[][];
    key: string;
    value: string;
  }>;
}

export interface SearchOptions {
  keys?: string[];
  threshold?: number;
  distance?: number;
  minMatchCharLength?: number;
  findAllMatches?: boolean;
  useExtendedSearch?: boolean;
  ignoreLocation?: boolean;
  ignoreFieldNorm?: boolean;
}

export class SearchService {
  private fuse: Fuse<any> | null = null;
  private data: any[] = [];

  constructor(data: any[] = [], options: SearchOptions = {}) {
    this.updateData(data, options);
  }

  updateData(data: any[], options: SearchOptions = {}) {
    this.data = data;
    
    if (data.length === 0) {
      this.fuse = null;
      return;
    }

    const defaultOptions: SearchOptions = {
      keys: this.extractKeys(data),
      threshold: 0.3,
      distance: 100,
      minMatchCharLength: 1,
      findAllMatches: true,
      useExtendedSearch: false,
      ignoreLocation: false,
      ignoreFieldNorm: false,
      ...options
    };

    this.fuse = new Fuse(data, defaultOptions);
  }

  search(query: string): SearchResult[] {
    if (!this.fuse || !query.trim()) {
      return [];
    }

    return this.fuse.search(query) as SearchResult[];
  }

  searchInField(query: string, field: string): SearchResult[] {
    if (!this.fuse || !query.trim()) {
      return [];
    }

    const fieldFuse = new Fuse(this.data, {
      keys: [field],
      threshold: 0.3,
      distance: 100,
      minMatchCharLength: 1,
      findAllMatches: true,
    });

    return fieldFuse.search(query) as SearchResult[];
  }

  searchMultipleFields(query: string, fields: string[]): SearchResult[] {
    if (!this.fuse || !query.trim()) {
      return [];
    }

    const fieldFuse = new Fuse(this.data, {
      keys: fields,
      threshold: 0.3,
      distance: 100,
      minMatchCharLength: 1,
      findAllMatches: true,
    });

    return fieldFuse.search(query) as SearchResult[];
  }

  highlightMatches(text: string, indices: number[][]): string {
    if (!indices || indices.length === 0) {
      return text;
    }

    let result = '';
    let lastIndex = 0;

    indices.forEach(([start, end]) => {
      result += text.slice(lastIndex, start);
      result += `<mark class="bg-yellow-200 dark:bg-yellow-800">${text.slice(start, end + 1)}</mark>`;
      lastIndex = end + 1;
    });

    result += text.slice(lastIndex);
    return result;
  }

  private extractKeys(data: any[]): string[] {
    if (data.length === 0) return [];

    const firstItem = data[0];
    const keys: string[] = [];

    const extractNestedKeys = (obj: any, prefix = '') => {
      for (const [key, value] of Object.entries(obj)) {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        
        if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
          extractNestedKeys(value, fullKey);
        } else {
          keys.push(fullKey);
        }
      }
    };

    extractNestedKeys(firstItem);
    return keys;
  }

  getSearchableFields(): string[] {
    return this.extractKeys(this.data);
  }

  getDataCount(): number {
    return this.data.length;
  }
}

// Utility function to flatten nested objects for search
export function flattenObject(obj: any, prefix = ''): Record<string, any> {
  const flattened: Record<string, any> = {};

  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(flattened, flattenObject(value, fullKey));
    } else {
      flattened[fullKey] = value;
    }
  }

  return flattened;
}

// Utility function to search in nested objects
export function searchInNestedObject(obj: any, searchTerm: string): boolean {
  const searchLower = searchTerm.toLowerCase();
  
  const searchRecursive = (item: any): boolean => {
    if (item === null || item === undefined) {
      return false;
    }
    
    if (typeof item === 'string') {
      return item.toLowerCase().includes(searchLower);
    }
    
    if (typeof item === 'number') {
      return item.toString().includes(searchTerm);
    }
    
    if (Array.isArray(item)) {
      return item.some(searchRecursive);
    }
    
    if (typeof item === 'object') {
      return Object.values(item).some(searchRecursive);
    }
    
    return false;
  };
  
  return searchRecursive(obj);
} 