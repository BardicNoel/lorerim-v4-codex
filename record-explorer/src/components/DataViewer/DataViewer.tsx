import { useAppStore } from '../../store/appStore';
import { TableView } from './TableView';

export function DataViewer() {
  const { files } = useAppStore();
  const { loaded, activeFileId } = files;
  
  const activeFile = loaded.find(file => file.id === activeFileId);

  if (!activeFile) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <p className="text-gray-500 dark:text-gray-400">
            Select a file from the sidebar to view its data
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-gray-900">
      {/* File header */}
      <div className="border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {activeFile.name}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {activeFile.data.length.toLocaleString()} records • 
              {(activeFile.size / 1024).toFixed(1)} KB
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Loaded {activeFile.loadedAt.toLocaleTimeString()}
            </span>
          </div>
        </div>
      </div>

      {/* Data view */}
      <div className="flex-1 overflow-hidden">
        <TableView data={activeFile.data} />
      </div>
    </div>
  );
} 