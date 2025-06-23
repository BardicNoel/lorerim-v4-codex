export type ViewMode = 'table' | 'tree' | 'json';

export interface Filter {
  field: string;
  operator: FilterOperator;
  value: any;
  enabled: boolean;
}

export type FilterOperator = 
  | 'equals' 
  | 'contains' 
  | 'startsWith' 
  | 'endsWith' 
  | 'greaterThan' 
  | 'lessThan' 
  | 'between' 
  | 'in' 
  | 'notIn';

export interface SortConfig {
  field: string;
  direction: 'asc' | 'desc';
}

export interface PaginationConfig {
  page: number;
  pageSize: number;
  totalPages: number;
  totalRecords: number;
}

export interface ColumnConfig {
  field: string;
  visible: boolean;
  width?: number;
  sortable: boolean;
  filterable: boolean;
} 