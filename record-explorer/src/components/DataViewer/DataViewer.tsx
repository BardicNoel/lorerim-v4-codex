import { useAppStore } from '../../store/appStore';
import { TableView } from './TableView';
import type { SearchResult } from '../../services/searchService';

interface DataViewerProps {
  searchResults?: SearchResult[];
}

export function DataViewer({ searchResults = [] }: DataViewerProps) {
  const { files } = useAppStore();
  const { loaded, activeFileId } = files;
  
  const activeFile = loaded.find(file => file.id === activeFileId);
  
  if (!activeFile) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-gray-500 dark:text-gray-400">
          Select a file to view its data
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          {activeFile.name}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {Array.isArray(activeFile.data) 
            ? `${activeFile.data.length.toLocaleString()} records`
            : 'Single record'
          }
        </p>
      </div>
      
      <div className="flex-1 overflow-auto">
        <TableView 
          data={Array.isArray(activeFile.data) ? activeFile.data : [activeFile.data]} 
          searchResults={searchResults}
        />
      </div>
    </div>
  );
} 