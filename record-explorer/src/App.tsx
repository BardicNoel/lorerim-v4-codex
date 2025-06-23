import { useEffect, useState } from 'react';
import { useAppStore } from './store/appStore';
import { FileManager } from './components/FileManager/FileManager';
import { DataViewer } from './components/DataViewer/DataViewer';
import { Header } from './components/UI/Header';
import { Sidebar } from './components/UI/Sidebar';
import type { SearchResult } from './services/searchService';

function App() {
  const { ui, files } = useAppStore();
  const { loaded } = files;
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);

  // Apply theme to document
  useEffect(() => {
    document.documentElement.classList.toggle('dark', ui.theme === 'dark');
  }, [ui.theme]);

  const handleSearchResults = (results: SearchResult[]) => {
    setSearchResults(results);
  };

  const handleSearchClear = () => {
    setSearchResults([]);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header 
        onSearchResults={handleSearchResults}
        onSearchClear={handleSearchClear}
      />
      
      <div className="flex h-[calc(100vh-4rem)]">
        <Sidebar />
        
        <main className="flex-1 flex flex-col overflow-hidden">
          {loaded.length === 0 ? (
            <FileManager />
          ) : (
            <DataViewer searchResults={searchResults} />
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
