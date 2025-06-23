import { useMemo } from 'react';

interface TableViewProps {
  data: any[];
}

export function TableView({ data }: TableViewProps) {
  const columns = useMemo(() => {
    if (data.length === 0) return [];
    
    const firstRecord = data[0];
    return Object.keys(firstRecord).map(key => ({
      key,
      label: key,
      type: typeof firstRecord[key],
    }));
  }, [data]);

  if (data.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-gray-500 dark:text-gray-400">No data to display</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
          <tr>
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
          {data.slice(0, 100).map((row, rowIndex) => (
            <tr
              key={rowIndex}
              className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              {columns.map((column) => (
                <td
                  key={column.key}
                  className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800"
                >
                  <div className="max-w-xs truncate">
                    {renderCellValue(row[column.key])}
                  </div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      
      {data.length > 100 && (
        <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700">
          Showing first 100 of {data.length.toLocaleString()} records
        </div>
      )}
    </div>
  );
}

function renderCellValue(value: any): string {
  if (value === null || value === undefined) {
    return '—';
  }
  
  if (typeof value === 'object') {
    return JSON.stringify(value).substring(0, 100) + (JSON.stringify(value).length > 100 ? '...' : '');
  }
  
  return String(value);
} 