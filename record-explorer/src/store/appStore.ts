import { create } from 'zustand';
import type { LoadedFile } from '../types/file';
import type { Schema, SchemaAnalysis } from '../types/schema';
import type { ViewMode, Filter, SortConfig, PaginationConfig } from '../types/viewer';

interface AppState {
  // Files state
  files: {
    loaded: LoadedFile[];
    activeFileId: string | null;
    loading: boolean;
  };
  
  // Viewer state
  viewer: {
    viewMode: ViewMode;
    filters: Filter[];
    sortConfig: SortConfig | null;
    pagination: PaginationConfig;
  };
  
  // Schema state
  schema: {
    current: Schema | null;
    analysis: SchemaAnalysis | null;
  };
  
  // UI state
  ui: {
    sidebarOpen: boolean;
    theme: 'light' | 'dark';
    layout: 'default' | 'compact';
  };
}

interface AppActions {
  // File actions
  addFile: (file: LoadedFile) => void;
  removeFile: (id: string) => void;
  setActiveFile: (id: string | null) => void;
  setLoading: (loading: boolean) => void;
  
  // Viewer actions
  setViewMode: (mode: ViewMode) => void;
  addFilter: (filter: Filter) => void;
  removeFilter: (index: number) => void;
  updateFilter: (index: number, filter: Filter) => void;
  setSortConfig: (config: SortConfig | null) => void;
  setPagination: (config: PaginationConfig) => void;
  
  // Schema actions
  setSchema: (schema: Schema | null) => void;
  setSchemaAnalysis: (analysis: SchemaAnalysis | null) => void;
  
  // UI actions
  toggleSidebar: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
  setLayout: (layout: 'default' | 'compact') => void;
}

type AppStore = AppState & AppActions;

const initialPagination: PaginationConfig = {
  page: 1,
  pageSize: 50,
  totalPages: 1,
  totalRecords: 0,
};

export const useAppStore = create<AppStore>((set) => ({
  // Initial state
  files: {
    loaded: [],
    activeFileId: null,
    loading: false,
  },
  
  viewer: {
    viewMode: 'table',
    filters: [],
    sortConfig: null,
    pagination: initialPagination,
  },
  
  schema: {
    current: null,
    analysis: null,
  },
  
  ui: {
    sidebarOpen: true,
    theme: 'light',
    layout: 'default',
  },
  
  // File actions
  addFile: (file) => set((state) => ({
    files: {
      ...state.files,
      loaded: [...state.files.loaded, file],
      activeFileId: state.files.activeFileId || file.id,
    },
  })),
  
  removeFile: (id) => set((state) => {
    const newLoaded = state.files.loaded.filter(f => f.id !== id);
    const newActiveId = state.files.activeFileId === id 
      ? (newLoaded.length > 0 ? newLoaded[0].id : null)
      : state.files.activeFileId;
    
    return {
      files: {
        ...state.files,
        loaded: newLoaded,
        activeFileId: newActiveId,
      },
    };
  }),
  
  setActiveFile: (id) => set((state) => ({
    files: {
      ...state.files,
      activeFileId: id,
    },
  })),
  
  setLoading: (loading) => set((state) => ({
    files: {
      ...state.files,
      loading,
    },
  })),
  
  // Viewer actions
  setViewMode: (viewMode) => set((state) => ({
    viewer: {
      ...state.viewer,
      viewMode,
    },
  })),
  
  addFilter: (filter) => set((state) => ({
    viewer: {
      ...state.viewer,
      filters: [...state.viewer.filters, filter],
    },
  })),
  
  removeFilter: (index) => set((state) => ({
    viewer: {
      ...state.viewer,
      filters: state.viewer.filters.filter((_, i) => i !== index),
    },
  })),
  
  updateFilter: (index, filter) => set((state) => ({
    viewer: {
      ...state.viewer,
      filters: state.viewer.filters.map((f, i) => i === index ? filter : f),
    },
  })),
  
  setSortConfig: (sortConfig) => set((state) => ({
    viewer: {
      ...state.viewer,
      sortConfig,
    },
  })),
  
  setPagination: (pagination) => set((state) => ({
    viewer: {
      ...state.viewer,
      pagination,
    },
  })),
  
  // Schema actions
  setSchema: (schema) => set((state) => ({
    schema: {
      ...state.schema,
      current: schema,
    },
  })),
  
  setSchemaAnalysis: (analysis) => set((state) => ({
    schema: {
      ...state.schema,
      analysis,
    },
  })),
  
  // UI actions
  toggleSidebar: () => set((state) => ({
    ui: {
      ...state.ui,
      sidebarOpen: !state.ui.sidebarOpen,
    },
  })),
  
  setTheme: (theme) => set((state) => ({
    ui: {
      ...state.ui,
      theme,
    },
  })),
  
  setLayout: (layout) => set((state) => ({
    ui: {
      ...state.ui,
      layout,
    },
  })),
})); 