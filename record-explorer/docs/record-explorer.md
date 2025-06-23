# Record Explorer - System Design

## Overview

Record Explorer is a React-based web application designed to load, view, and analyze JSON files containing array data. The application provides tools for exploring large datasets and converting JSON to markdown documentation.

## Current Implementation Status

### ✅ Completed Features
- **Project Setup**: React 18 + TypeScript + Vite + Tailwind CSS v4
- **State Management**: Zustand store with comprehensive state structure
- **File Loading**: Basic JSON file loading with validation
- **UI Components**: Header, Sidebar, FileManager, DataViewer
- **Table View**: Basic table display for JSON arrays
- **Theme Support**: Light/dark mode toggle
- **Responsive Layout**: Collapsible sidebar and responsive design

### 🚧 In Progress
- **Schema Analysis**: Basic structure defined, implementation pending
- **Advanced Table Features**: Sorting, filtering, pagination
- **Export Tools**: JSON to Markdown conversion

### 📋 Planned Features
- **Tree View**: Hierarchical view for nested JSON structures
- **Drag & Drop**: Enhanced file loading experience
- **Data Validation**: Schema validation and error reporting
- **Performance Optimizations**: Virtual scrolling, lazy loading

## Core Features

### 1. File Loading & Management
- **✅ File Loading**: Load individual JSON files with validation
- **✅ File Browser**: Navigate through loaded files in sidebar
- **✅ File Validation**: JSON parsing and array structure validation
- **🔄 Folder Loading**: Basic folder support via webkitdirectory
- **📋 Drag & Drop**: Support for dragging folders or individual files

### 2. JSON Array Viewer
- **✅ Table View**: Display JSON arrays as tables with column types
- **✅ Basic Display**: Shows first 100 records with truncation
- **🔄 Advanced Features**: Sorting, filtering, pagination (planned)
- **📋 Tree View**: Hierarchical view for nested JSON structures
- **📋 Column Management**: Show/hide columns, resize, reorder

### 3. Data Analysis Tools
- **📋 Statistics Panel**: Show data distribution, field types, null values
- **📋 Schema Inspector**: Analyze JSON structure and field types
- **📋 Data Validation**: Identify malformed or inconsistent data
- **📋 Export Options**: Export filtered/selected data in various formats

### 4. Documentation Tools
- **📋 JSON to Markdown**: Convert JSON arrays to readable markdown tables
- **📋 Schema Documentation**: Generate field descriptions and examples
- **📋 Report Generation**: Create comprehensive data reports

## Technical Architecture

### Frontend Stack
- **✅ React 18**: Core framework with hooks and modern patterns
- **✅ TypeScript**: Type safety and better developer experience
- **✅ Vite**: Fast development server and build tool
- **✅ Tailwind CSS v4**: Utility-first styling with PostCSS integration
- **📋 React Router**: Client-side routing (planned)
- **✅ Zustand**: Lightweight state management

### Key Components

#### 1. FileManager ✅
```typescript
interface FileManager {
  loadFile(file: File): Promise<LoadedFile>
  loadFolder(files: FileList): Promise<LoadedFile[]>
  validateJSON(text: string): boolean
  validateArray(data: any): boolean
}
```

#### 2. DataViewer ✅
```typescript
interface DataViewer {
  renderTable(data: any[]): JSX.Element
  renderCellValue(value: any): string
  handleLargeDatasets(data: any[]): any[]
}
```

#### 3. SchemaAnalyzer 📋
```typescript
interface SchemaAnalyzer {
  analyzeSchema(data: any[]): Schema
  detectFieldTypes(data: any[]): FieldTypeMap
  validateData(data: any[], schema: Schema): ValidationResult[]
}
```

#### 4. ExportManager 📋
```typescript
interface ExportManager {
  toMarkdown(data: any[], schema: Schema): string
  toCSV(data: any[]): string
  toJSON(data: any[], pretty: boolean): string
}
```

### State Management ✅

#### Global State Structure
```typescript
interface AppState {
  files: {
    loaded: LoadedFile[]
    activeFileId: string | null
    loading: boolean
  }
  viewer: {
    viewMode: 'table' | 'tree' | 'json'
    filters: Filter[]
    sortConfig: SortConfig
    pagination: PaginationConfig
  }
  schema: {
    current: Schema | null
    analysis: SchemaAnalysis | null
  }
  ui: {
    sidebarOpen: boolean
    theme: 'light' | 'dark'
    layout: 'default' | 'compact'
  }
}
```

### File Structure ✅
```
record-explorer/
├── src/
│   ├── components/
│   │   ├── FileManager/
│   │   │   └── FileManager.tsx ✅
│   │   ├── DataViewer/
│   │   │   ├── DataViewer.tsx ✅
│   │   │   └── TableView.tsx ✅
│   │   ├── SchemaAnalyzer/ 📋
│   │   ├── ExportTools/ 📋
│   │   └── UI/
│   │       ├── Header.tsx ✅
│   │       └── Sidebar.tsx ✅
│   ├── hooks/ 📋
│   ├── services/ 📋
│   ├── types/
│   │   ├── file.ts ✅
│   │   ├── schema.ts ✅
│   │   └── viewer.ts ✅
│   ├── utils/ 📋
│   ├── store/
│   │   └── appStore.ts ✅
│   ├── App.tsx ✅
│   └── index.css ✅
├── docs/
│   └── record-explorer.md ✅
├── tailwind.config.cjs ✅
├── postcss.config.cjs ✅
└── package.json ✅
```

## User Interface Design ✅

### Layout
- **✅ Header**: App title, theme toggle, global search (placeholder)
- **✅ Sidebar**: File browser with file management
- **✅ Main Content**: Data viewer with table display
- **📋 Status Bar**: File info, record count, loading states

### Responsive Design
- **✅ Desktop**: Full sidebar, detailed table view
- **✅ Tablet**: Collapsible sidebar, optimized table
- **📋 Mobile**: Stacked layout, simplified table view

## Performance Considerations

### Large Dataset Handling
- **✅ Basic Limiting**: Shows first 100 records
- **📋 Virtual Scrolling**: Only render visible rows
- **📋 Lazy Loading**: Load data in chunks
- **📋 Web Workers**: Process large files in background
- **📋 IndexedDB**: Cache processed data locally

### Memory Management
- **✅ Basic Validation**: JSON parsing and array validation
- **📋 Data Streaming**: Process files without loading entirely into memory
- **📋 Garbage Collection**: Clear unused data from memory
- **📋 Compression**: Compress cached data

## Security Considerations ✅

### File Access
- **✅ Client-side Only**: No server uploads, all processing local
- **✅ File Validation**: Validate JSON structure before processing
- **📋 Size Limits**: Prevent loading extremely large files
- **✅ Content Security**: Sanitize data before rendering

## Development Phases

### ✅ Phase 1: Core Infrastructure (COMPLETED)
1. ✅ Project setup with React + TypeScript + Vite
2. ✅ Basic file loading and JSON parsing
3. ✅ Simple table viewer for JSON arrays
4. ✅ Basic state management with Zustand
5. ✅ UI components and responsive layout
6. ✅ Theme support (light/dark mode)

### 🚧 Phase 2: Enhanced Viewing (IN PROGRESS)
1. 🔄 Advanced table features (sorting, filtering, pagination)
2. 📋 Tree view for nested structures
3. 📋 Schema analysis and validation
4. 📋 Search functionality

### 📋 Phase 3: Export & Documentation (PLANNED)
1. 📋 JSON to Markdown conversion
2. 📋 Multiple export formats (CSV, JSON)
3. 📋 Report generation
4. 📋 Schema documentation

### 📋 Phase 4: Polish & Optimization (PLANNED)
1. 📋 Performance optimizations
2. 📋 UI/UX improvements
3. 📋 Advanced features (data visualization, analytics)
4. 📋 Testing and documentation

## Getting Started

### Prerequisites
- Node.js 18+ and Yarn
- Modern browser with ES6+ support

### Installation
```bash
cd record-explorer
yarn install
```

### Development
```bash
yarn vite
```

### Build
```bash
yarn build
```

## Success Metrics

- **✅ Performance**: Basic table display working
- **✅ Usability**: Intuitive interface for file loading and viewing
- **✅ Functionality**: Support for JSON array structures
- **✅ Reliability**: Handle malformed JSON gracefully
- **📋 Performance**: Load and display 10,000+ records smoothly (planned)

## Next Steps

1. **Implement Schema Analysis**: Add automatic field type detection and validation
2. **Enhance Table Features**: Add sorting, filtering, and pagination
3. **Add Export Functionality**: Implement JSON to Markdown conversion
4. **Performance Optimization**: Add virtual scrolling for large datasets
5. **Add Tree View**: Support for nested JSON structures
6. **Implement Drag & Drop**: Enhanced file loading experience
