import { useMemo, useState } from 'react';
import { ChevronRightIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import type { SearchResult } from '../../services/searchService';

interface TableViewProps {
  data: any[];
  searchResults?: SearchResult[];
}

interface ExpandedRows {
  [key: number]: boolean;
}

export function TableView({ data, searchResults = [] }: TableViewProps) {
  const [expandedRows, setExpandedRows] = useState<ExpandedRows>({});
  
  // Use search results if available, otherwise use original data
  const displayData = searchResults.length > 0 
    ? searchResults.map(result => result.item)
    : data;
  
  const columns = useMemo(() => {
    if (displayData.length === 0) return [];
    
    const firstRecord = displayData[0];
    return Object.keys(firstRecord).map(key => ({
      key,
      label: key,
      type: typeof firstRecord[key],
      isObject: typeof firstRecord[key] === 'object' && firstRecord[key] !== null && !Array.isArray(firstRecord[key]),
      isArray: Array.isArray(firstRecord[key]),
    }));
  }, [displayData]);

  const toggleRowExpansion = (rowIndex: number) => {
    setExpandedRows(prev => ({
      ...prev,
      [rowIndex]: !prev[rowIndex]
    }));
  };

  // Find search result for a specific item
  const getSearchResult = (item: any): SearchResult | undefined => {
    return searchResults.find(result => result.item === item);
  };

  // Highlight text with search matches
  const highlightText = (text: string, searchResult?: SearchResult): string => {
    if (!searchResult?.matches) return text;
    
    let highlightedText = text;
    searchResult.matches.forEach(match => {
      if (match.indices && match.indices.length > 0) {
        let result = '';
        let lastIndex = 0;
        
        match.indices.forEach(([start, end]) => {
          result += highlightedText.slice(lastIndex, start);
          result += `<mark class="bg-yellow-200 dark:bg-yellow-800">${highlightedText.slice(start, end + 1)}</mark>`;
          lastIndex = end + 1;
        });
        
        result += highlightedText.slice(lastIndex);
        highlightedText = result;
      }
    });
    
    return highlightedText;
  };

  if (displayData.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-gray-500 dark:text-gray-400">
          {searchResults.length > 0 ? 'No search results found' : 'No data to display'}
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Search results indicator */}
      {searchResults.length > 0 && (
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            Showing {searchResults.length} search result{searchResults.length !== 1 ? 's' : ''} 
            {searchResults.length !== data.length && ` of ${data.length} total records`}
          </p>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700">
                {/* Expand column */}
              </th>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-center space-x-1">
                    <span>{column.label}</span>
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      ({column.type})
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {displayData.slice(0, 100).map((row, rowIndex) => {
              const searchResult = getSearchResult(row);
              const isSearchResult = !!searchResult;
              
              return (
                <>
                  <tr
                    key={rowIndex}
                    className={`hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                      isSearchResult ? 'bg-yellow-50 dark:bg-yellow-900/10' : ''
                    }`}
                  >
                    <td className="px-2 py-4">
                      {columns.some(col => col.isObject || col.isArray) && (
                        <button
                          onClick={() => toggleRowExpansion(rowIndex)}
                          className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                        >
                          {expandedRows[rowIndex] ? (
                            <ChevronDownIcon className="h-4 w-4 text-gray-500" />
                          ) : (
                            <ChevronRightIcon className="h-4 w-4 text-gray-500" />
                          )}
                        </button>
                      )}
                    </td>
                    {columns.map((column) => (
                      <td
                        key={column.key}
                        className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800"
                      >
                        <div className="max-w-xs">
                          {isSearchResult ? (
                            <div 
                              dangerouslySetInnerHTML={{ 
                                __html: highlightText(
                                  renderCellValue(row[column.key], column.isObject, column.isArray),
                                  searchResult
                                )
                              }} 
                            />
                          ) : (
                            renderCellValue(row[column.key], column.isObject, column.isArray)
                          )}
                        </div>
                      </td>
                    ))}
                  </tr>
                  {expandedRows[rowIndex] && (
                    <tr key={`${rowIndex}-expanded`}>
                      <td colSpan={columns.length + 1} className="px-6 py-4 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                        <div className="space-y-4">
                          {columns.map((column) => {
                            const value = row[column.key];
                            if (column.isObject && value !== null) {
                              return (
                                <div key={column.key} className="border-l-2 border-blue-200 dark:border-blue-800 pl-4">
                                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                                    {column.label} (Object)
                                  </h4>
                                  <ObjectViewer data={value} />
                                </div>
                              );
                            }
                            if (column.isArray && Array.isArray(value)) {
                              return (
                                <div key={column.key} className="border-l-2 border-green-200 dark:border-green-800 pl-4">
                                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                                    {column.label} (Array - {value.length} items)
                                  </h4>
                                  <ArrayViewer data={value} />
                                </div>
                              );
                            }
                            return null;
                          })}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {displayData.length > 100 && (
        <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
          Showing first 100 of {displayData.length.toLocaleString()} records
        </div>
      )}
    </div>
  );
}

function renderCellValue(value: any, isObject: boolean, isArray: boolean): string {
  if (value === null || value === undefined) {
    return '—';
  }
  
  if (isObject) {
    return `{${Object.keys(value).length} properties}`;
  }
  
  if (isArray) {
    return `[${value.length} items]`;
  }
  
  if (typeof value === 'object') {
    return JSON.stringify(value).substring(0, 100) + (JSON.stringify(value).length > 100 ? '...' : '');
  }
  
  return String(value);
}

function ObjectViewer({ data }: { data: Record<string, any>; searchResult?: SearchResult }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700 overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Property
            </th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Type
            </th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Value
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {Object.entries(data).map(([key, value]) => (
            <tr key={key} className="hover:bg-gray-50 dark:hover:bg-gray-800">
              <td className="px-4 py-2 text-sm font-medium text-gray-900 dark:text-white">
                {key}
              </td>
              <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
                {Array.isArray(value) ? 'array' : typeof value}
              </td>
              <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">
                <div className="max-w-xs truncate">
                  {renderNestedValue(value)}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ArrayViewer({ data }: { data: any[]; searchResult?: SearchResult }) {
  if (data.length === 0) {
    return <p className="text-gray-500 dark:text-gray-400">Empty array</p>;
  }

  if (data.length > 10) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Showing first 10 of {data.length} items
        </p>
        <div className="space-y-2">
          {data.slice(0, 10).map((item, index) => (
            <div key={index} className="bg-white dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700 p-2">
              <span className="text-xs text-gray-500 dark:text-gray-400 mr-2">[{index}]:</span>
              <span className="text-sm text-gray-900 dark:text-white">
                {renderNestedValue(item)}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {data.map((item, index) => (
        <div key={index} className="bg-white dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700 p-2">
          <span className="text-xs text-gray-500 dark:text-gray-400 mr-2">[{index}]:</span>
          <span className="text-sm text-gray-900 dark:text-white">
            {renderNestedValue(item)}
          </span>
        </div>
      ))}
    </div>
  );
}

function renderNestedValue(value: any): string {
  if (value === null || value === undefined) {
    return '—';
  }
  
  if (typeof value === 'object') {
    if (Array.isArray(value)) {
      return `[${value.length} items]`;
    }
    return `{${Object.keys(value).length} properties}`;
  }
  
  return String(value);
} 