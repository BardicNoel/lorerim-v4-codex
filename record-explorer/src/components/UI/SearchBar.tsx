import { useState, useEffect, useCallback } from 'react';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { SearchService, type SearchResult } from '../../services/searchService';

interface SearchBarProps {
  data: any[];
  onSearchResults: (results: SearchResult[]) => void;
  onSearchClear: () => void;
  placeholder?: string;
  className?: string;
}

export function SearchBar({ 
  data, 
  onSearchResults, 
  onSearchClear, 
  placeholder = "Search records...",
  className = ""
}: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [searchService, setSearchService] = useState<SearchService | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  // Initialize search service when data changes
  useEffect(() => {
    if (data.length > 0) {
      const service = new SearchService(data);
      setSearchService(service);
    } else {
      setSearchService(null);
    }
  }, [data]);

  // Debounced search
  const debouncedSearch = useCallback(
    (() => {
      let timeoutId: number;
      return (searchQuery: string) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          if (!searchService || !searchQuery.trim()) {
            onSearchClear();
            setIsSearching(false);
            return;
          }

          setIsSearching(true);
          const results = searchService.search(searchQuery);
          onSearchResults(results);
          setIsSearching(false);
        }, 300);
      };
    })(),
    [searchService, onSearchResults, onSearchClear]
  );

  // Handle search input changes
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    
    if (newQuery.trim()) {
      debouncedSearch(newQuery);
    } else {
      onSearchClear();
    }
  };

  // Clear search
  const handleClearSearch = () => {
    setQuery('');
    onSearchClear();
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={handleSearchChange}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {query && (
          <button
            onClick={handleClearSearch}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <XMarkIcon className="h-4 w-4 text-gray-400" />
          </button>
        )}
      </div>
      
      {isSearching && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
        </div>
      )}
    </div>
  );
} 