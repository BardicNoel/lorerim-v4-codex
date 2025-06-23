import { useAppStore } from '../../store/appStore';
import { SunIcon, MoonIcon, Bars3Icon } from '@heroicons/react/24/outline';

export function Header() {
  const { ui, toggleSidebar, setTheme } = useAppStore();

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
        {/* Global search - placeholder for now */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search records..."
            className="w-64 px-4 py-2 pl-10 pr-4 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
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