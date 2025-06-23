import { useAppStore } from '../../store/appStore';
import { DocumentIcon, FolderIcon, XMarkIcon } from '@heroicons/react/24/outline';

export function Sidebar() {
  const { ui, files, setActiveFile, removeFile } = useAppStore();
  const { loaded, activeFileId } = files;

  if (!ui.sidebarOpen) {
    return null;
  }

  return (
    <aside className="fixed left-0 top-16 h-full w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Files</h2>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {loaded.length} loaded
          </span>
        </div>

        {loaded.length === 0 ? (
          <div className="text-center py-8">
            <FolderIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No files loaded
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {loaded.map((file) => (
              <div
                key={file.id}
                className={`group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                  activeFileId === file.id
                    ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
                onClick={() => setActiveFile(file.id)}
              >
                <div className="flex items-center space-x-3 min-w-0 flex-1">
                  <DocumentIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm font-medium truncate ${
                      activeFileId === file.id
                        ? 'text-blue-900 dark:text-blue-100'
                        : 'text-gray-900 dark:text-white'
                    }`}>
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {file.data.length.toLocaleString()} records
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(file.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/20 transition-all"
                >
                  <XMarkIcon className="h-4 w-4 text-red-500" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
} 