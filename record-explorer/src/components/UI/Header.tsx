import { useAppStore } from '../../store/appStore';
import { SunIcon, MoonIcon, Bars3Icon } from '@heroicons/react/24/outline';
import { SearchBar } from './SearchBar';
import type { SearchResult } from '../../services/searchService';

interface HeaderProps {
  onSearchResults: (results: SearchResult[]) => void;
  onSearchClear: () => void;
}

export function Header({ onSearchResults, onSearchClear }: HeaderProps) {
  const { ui, toggleSidebar, setTheme, files } = useAppStore();
  const { loaded, activeFileId } = files;

  const activeFile = loaded.find(file => file.id === activeFileId);
  const activeData = activeFile?.data || [];

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 h-16 flex items-center justify-between px-4">
      <div className="flex items-center space-x-4">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <Bars3Icon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
        </button>
        
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
          Record Explorer
        </h1>
      </div>

      <div className="flex items-center space-x-4">
        {/* Global search */}
        <div className="w-64">
          <SearchBar
            data={activeData}
            onSearchResults={onSearchResults}
            onSearchClear={onSearchClear}
            placeholder="Search records..."
          />
        </div>

        {/* Theme toggle */}
        <button
          onClick={() => setTheme(ui.theme === 'light' ? 'dark' : 'light')}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          {ui.theme === 'light' ? (
            <MoonIcon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
          ) : (
            <SunIcon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
          )}
        </button>
      </div>
    </header>
  );
} 