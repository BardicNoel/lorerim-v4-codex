import { useCallback } from 'react';
import { useAppStore } from '../../store/appStore';
import { CloudArrowUpIcon } from '@heroicons/react/24/outline';
import type { LoadedFile } from '../../types/file';
import { generateSampleNestedData, generateSimpleNestedData } from '../../utils/sampleData';

export function FileManager() {
  const { addFile, setLoading } = useAppStore();

  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    setLoading(true);
    
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        if (!file.name.endsWith('.json')) {
          console.warn(`Skipping non-JSON file: ${file.name}`);
          continue;
        }

        const text = await file.text();
        let data;
        
        try {
          data = JSON.parse(text);
        } catch (error) {
          console.error(`Failed to parse JSON in ${file.name}:`, error);
          continue;
        }

        // Ensure data is an array
        if (!Array.isArray(data)) {
          console.warn(`File ${file.name} does not contain a JSON array`);
          continue;
        }

        const loadedFile: LoadedFile = {
          id: `${file.name}-${Date.now()}-${i}`,
          name: file.name,
          path: file.webkitRelativePath || file.name,
          size: file.size,
          data,
          schema: null, // Will be analyzed later
          loadedAt: new Date(),
        };

        addFile(loadedFile);
      }
    } catch (error) {
      console.error('Error loading files:', error);
    } finally {
      setLoading(false);
    }
    
    // Reset the input
    event.target.value = '';
  }, [addFile, setLoading]);

  const handleFolderSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    setLoading(true);
    
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        if (!file.name.endsWith('.json')) {
          continue;
        }

        const text = await file.text();
        let data;
        
        try {
          data = JSON.parse(text);
        } catch (error) {
          console.error(`Failed to parse JSON in ${file.name}:`, error);
          continue;
        }

        if (!Array.isArray(data)) {
          continue;
        }

        const loadedFile: LoadedFile = {
          id: `${file.name}-${Date.now()}-${i}`,
          name: file.name,
          path: file.webkitRelativePath || file.name,
          size: file.size,
          data,
          schema: null,
          loadedAt: new Date(),
        };

        addFile(loadedFile);
      }
    } catch (error) {
      console.error('Error loading folder:', error);
    } finally {
      setLoading(false);
    }
    
    event.target.value = '';
  }, [addFile, setLoading]);

  const loadDemoData = useCallback((type: 'simple' | 'complex') => {
    setLoading(true);
    
    try {
      const data = type === 'simple' ? generateSimpleNestedData() : generateSampleNestedData(5);
      const loadedFile: LoadedFile = {
        id: `demo-${type}-${Date.now()}`,
        name: `Demo ${type === 'simple' ? 'Simple' : 'Complex'} Nested Data`,
        path: `demo-${type}.json`,
        size: JSON.stringify(data).length,
        data,
        schema: null,
        loadedAt: new Date(),
      };

      addFile(loadedFile);
    } catch (error) {
      console.error('Error loading demo data:', error);
    } finally {
      setLoading(false);
    }
  }, [addFile, setLoading]);

  return (
    <div className="space-y-4">
      <div className="flex space-x-4">
        {/* Single file upload */}
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Load JSON Files
          </label>
          <input
            type="file"
            multiple
            accept=".json"
            onChange={handleFileSelect}
            className="block w-full text-sm text-gray-500 dark:text-gray-400
              file:mr-4 file:py-2 file:px-4
              file:rounded-lg file:border-0
              file:text-sm file:font-medium
              file:bg-blue-50 file:text-blue-700
              dark:file:bg-blue-900/20 dark:file:text-blue-300
              hover:file:bg-blue-100 dark:hover:file:bg-blue-900/30
              cursor-pointer"
          />
        </div>

        {/* Folder upload */}
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Load Folder
          </label>
          <input
            type="file"
            {...({ webkitdirectory: '' } as any)}
            multiple
            onChange={handleFolderSelect}
            className="block w-full text-sm text-gray-500 dark:text-gray-400
              file:mr-4 file:py-2 file:px-4
              file:rounded-lg file:border-0
              file:text-sm file:font-medium
              file:bg-green-50 file:text-green-700
              dark:file:bg-green-900/20 dark:file:text-green-300
              hover:file:bg-green-100 dark:hover:file:bg-green-900/30
              cursor-pointer"
          />
        </div>
      </div>

      {/* Demo data buttons */}
      <div className="flex space-x-4">
        <button
          onClick={() => loadDemoData('simple')}
          className="px-4 py-2 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-lg border border-purple-200 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
        >
          Load Simple Demo Data
        </button>
        <button
          onClick={() => loadDemoData('complex')}
          className="px-4 py-2 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 rounded-lg border border-orange-200 dark:border-orange-800 hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors"
        >
          Load Complex Demo Data
        </button>
      </div>

      {/* Drag and drop area */}
      <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center hover:border-gray-400 dark:hover:border-gray-500 transition-colors">
        <CloudArrowUpIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Drag and drop JSON files here, or click to browse
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
          Supports single files or entire folders
        </p>
      </div>
    </div>
  );
} 